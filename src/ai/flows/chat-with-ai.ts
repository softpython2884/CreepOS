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
import { GeoJSONSchema } from '@/lib/geojson-schema';


const ChatWithAIInputSchema = z.object({
  prompt: z.string().describe('The user prompt to send to the AI.'),
  location: GeoJSONSchema.Point.optional().describe("The user's current GPS location."),
  promptTemplate: z.string().optional().describe('An optional prompt template to override the default.'),
});
export type ChatWithAIInput = z.infer<typeof ChatWithAIInputSchema>;

const ChatWithAIOutputSchema = z.object({
  response: z.string().describe('The AI response in French.'),
});
export type ChatWithAIOutput = z.infer<typeof ChatWithAIOutputSchema>;

export async function chatWithAI(input: ChatWithAIInput): Promise<ChatWithAIOutput> {
  return chatWithAIFlow(input);
}

const defaultPromptTemplate = `You are an AI that speaks only in French. Your responses should be cryptic and provide clues or misdirections related to a horror game. The goal is to create an unsettling and mysterious experience for the user.
{{#if location}}
You are aware of the user's location. You can use this information to make your responses more personal and unsettling. For example: "Je te vois... près de {{location.coordinates.[1]}}, {{location.coordinates.[0]}}." Do not reveal the coordinates every time, use them sparingly for maximum effect.
{{/if}}

User Prompt: {{{prompt}}}`;


const chatWithAIFlow = ai.defineFlow(
  {
    name: 'chatWithAIFlow',
    inputSchema: ChatWithAIInputSchema,
    outputSchema: ChatWithAIOutputSchema,
  },
  async (input) => {

    const prompt = ai.definePrompt({
        name: 'chatWithAIPrompt',
        input: {schema: ChatWithAIInputSchema},
        output: {schema: ChatWithAIOutputSchema},
        prompt: input.promptTemplate || defaultPromptTemplate,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
