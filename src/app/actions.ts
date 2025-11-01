'use server';

import { chatWithAI as chatWithAIFlow, ChatWithAIInput } from '@/ai/flows/chat-with-ai';
import { generateInitialHint as generateInitialHintFlow, GenerateInitialHintInput } from '@/ai/flows/generate-initial-hint';
import { chatCorrupted as chatCorruptedFlow, ChatCorruptedInput } from '@/ai/flows/chat-corrupted-flow';
import { z } from 'zod';

const chatSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
});

const hintSchema = z.object({
  userPrompt: z.string().min(1),
});

const corruptedChatSchema = z.object({
    prompt: z.string(),
    messageHistory: z.preprocess((val) => {
        if (typeof val === 'string') return JSON.parse(val);
        return val;
    }, z.array(z.string())),
});

interface ActionState {
  response?: string;
  error?: string;
}

interface CorruptedActionState extends ActionState {
    shouldFinish?: boolean;
}

export async function chatWithAI(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = chatSchema.safeParse({
    prompt: formData.get('prompt'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid prompt.' };
  }

  try {
    const { prompt } = validatedFields.data;
    const flowInput: ChatWithAIInput = { prompt };
    
    const result = await chatWithAIFlow(flowInput);
    return { response: result.response };
  } catch (e) {
    return { error: 'AI failed to respond. The system may be unstable.' };
  }
}

export async function generateInitialHint(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = hintSchema.safeParse({
    userPrompt: formData.get('userPrompt'),
  });
    
  if (!validatedFields.success) {
    return { error: 'Invalid hint request.' };
  }
    
  try {
    const result = await generateInitialHintFlow(validatedFields.data as GenerateInitialHintInput);
    return { response: result.hint };
  } catch (e) {
    return { error: 'Failed to get a hint. Try again later.' };
  }
}

export async function chatCorrupted(prevState: CorruptedActionState, formData: FormData): Promise<CorruptedActionState> {
    const messageHistoryJson = formData.get('messageHistory') as string;
    const validatedFields = corruptedChatSchema.safeParse({
      prompt: formData.get('prompt'),
      messageHistory: messageHistoryJson ? JSON.parse(messageHistoryJson) : [],
    });
  
    if (!validatedFields.success) {
      return { error: 'Invalid input.' };
    }
  
    try {
      const result = await chatCorruptedFlow(validatedFields.data as ChatCorruptedInput);
      return result;
    } catch (e) {
      return { error: 'AI failed to respond.' };
    }
  }
