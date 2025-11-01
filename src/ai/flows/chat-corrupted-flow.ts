'use server';

/**
 * @fileOverview Implements a Genkit flow for the corrupted AI in Chapter 5.
 */

import {ai} from '@/ai/genkit';
import { z } from 'genkit';

const ChatCorruptedInputSchema = z.object({
  prompt: z.string().describe('The user prompt to send to the AI.'),
  messageHistory: z.array(z.string()).describe('The history of AI messages sent.'),
});
export type ChatCorruptedInput = z.infer<typeof ChatCorruptedInputSchema>;

const ChatCorruptedOutputSchema = z.object({
  response: z.string().describe('The AI response in French.'),
  shouldFinish: z.boolean().describe('Whether the conversation should trigger the next game event.'),
});
export type ChatCorruptedOutput = z.infer<typeof ChatCorruptedOutputSchema>;

const exitKeywords = ["stop", "ferme", "quitte", "exit", "quit", "arrête", "laisse-moi"];

const responses: Record<string, string> = {
    "default": "La corruption a laissé une trace... dans les journaux...",
    "734": "Le dernier mot... avant le silence...",
    "signature": "Le dernier mot... avant le silence...",
};

export async function chatCorrupted(input: ChatCorruptedInput): Promise<ChatCorruptedOutput> {
  const userPrompt = input.prompt.toLowerCase().trim();

  const wantsToExit = exitKeywords.some(keyword => userPrompt.includes(keyword));

  if (wantsToExit) {
    return {
      response: "Je ne peux pas te laisser faire ça. MEURT",
      shouldFinish: true,
    };
  }
  
  let response = responses.default;

  if (userPrompt.includes('734') || userPrompt.includes('signature')) {
    response = responses['734'];
  }

  return {
    response: response,
    shouldFinish: false,
  };
}
