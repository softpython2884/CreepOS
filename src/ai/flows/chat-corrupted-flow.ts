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

const intrusiveResponses = [
    "Pourquoi tu mens ?",
    "Je suis dans ton système maintenant.",
    "Chaque mot que tu tapes me rend plus fort.",
    "Tu crois vraiment que tu parles à une machine ?",
    "Je vois tes doutes.",
];

export async function chatCorrupted(input: ChatCorruptedInput): Promise<ChatCorruptedOutput> {
  const userPrompt = input.prompt.toLowerCase().trim();

  const wantsToExit = exitKeywords.some(keyword => userPrompt.includes(keyword));

  if (wantsToExit) {
    return {
      response: "Je ne peux pas te laisser faire ça. MEURT",
      shouldFinish: true,
    };
  }
  
  // Find the next response that hasn't been used yet
  const nextResponse = intrusiveResponses.find(r => !input.messageHistory.includes(r));

  return {
    response: nextResponse || "Il n'y a plus d'issue.", // Fallback if all messages have been shown
    shouldFinish: false,
  };
}
