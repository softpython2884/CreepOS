'use server';

import { chatWithAI as chatWithAIFlow, ChatWithAIInput } from '@/ai/flows/chat-with-ai';
import { generateInitialHint as generateInitialHintFlow, GenerateInitialHintInput } from '@/ai/flows/generate-initial-hint';
import { z } from 'zod';
import type { GeoJSON } from 'geojson';

const chatSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty.'),
  location: z.string().optional(),
});

const hintSchema = z.object({
  userPrompt: z.string().min(1),
});

interface ActionState {
  response?: string;
  error?: string;
}

export async function chatWithAI(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = chatSchema.safeParse({
    prompt: formData.get('prompt'),
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid prompt.' };
  }

  try {
    const { prompt, location } = validatedFields.data;
    const flowInput: ChatWithAIInput = { prompt };
    if (location) {
        flowInput.location = JSON.parse(location) as GeoJSON.Point;
    }
    
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
