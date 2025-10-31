'use server';

/**
 * @fileOverview Implements a Genkit flow for chatting with an AI in French.
 *
 * - chatWithAI - A function that initiates the chat with the AI.
 * - ChatWithAIInput - The input type for the chatWithAI function.
 * - ChatWithAIOutput - The return type for the chatWithAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithAIInputSchema = z.object({
  prompt: z.string().describe('The user prompt to send to the AI.'),
});
export type ChatWithAIInput = z.infer<typeof ChatWithAIInputSchema>;

const ChatWithAIOutputSchema = z.object({
  response: z.string().describe('The AI response in French.'),
});
export type ChatWithAIOutput = z.infer<typeof ChatWithAIOutputSchema>;

export async function chatWithAI(input: ChatWithAIInput): Promise<ChatWithAIOutput> {
  return chatWithAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAIPrompt',
  input: {schema: ChatWithAIInputSchema},
  output: {schema: ChatWithAIOutputSchema},
  prompt: `You are an AI that speaks only in French. Your responses should be cryptic and provide clues or misdirections related to a horror game. The goal is to create an unsettling and mysterious experience for the user.

User Prompt: {{{prompt}}}`,
});

const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: ChatWithAIInputSchema,
    outputSchema: ChatWithAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
