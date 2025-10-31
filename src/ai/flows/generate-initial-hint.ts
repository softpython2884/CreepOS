'use server';

/**
 * @fileOverview Generates an initial hint for the user in the game.
 *
 * - generateInitialHint - A function that generates the hint.
 * - GenerateInitialHintInput - The input type for the generateInitialHint function.
 * - GenerateInitialHintOutput - The return type for the generateInitialHint function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialHintInputSchema = z.object({
  userPrompt: z.string().describe('The user\u0027s prompt asking for a hint.'),
});
export type GenerateInitialHintInput = z.infer<typeof GenerateInitialHintInputSchema>;

const GenerateInitialHintOutputSchema = z.object({
  hint: z.string().describe('The AI generated hint for the user.'),
});
export type GenerateInitialHintOutput = z.infer<typeof GenerateInitialHintOutputSchema>;

export async function generateInitialHint(input: GenerateInitialHintInput): Promise<GenerateInitialHintOutput> {
  return generateInitialHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialHintPrompt',
  input: {schema: GenerateInitialHintInputSchema},
  output: {schema: GenerateInitialHintOutputSchema},
  prompt: `You are an AI assistant in a text-based horror game. The user has asked for a hint.

User prompt: {{{userPrompt}}}

Provide a subtle hint to guide the user without giving away the solution directly. Respond in French. Keep the hint concise. Focus on providing context and clues to help the user progress in the game. Remember to be somewhat mysterious and unsettling.`,
});

const generateInitialHintFlow = ai.defineFlow(
  {
    name: 'generateInitialHintFlow',
    inputSchema: GenerateInitialHintInputSchema,
    outputSchema: GenerateInitialHintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
