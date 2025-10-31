import { config } from 'dotenv';
config();

import '@/ai/flows/generate-initial-hint.ts';
import '@/ai/flows/chat-with-ai.ts';
import '@/ai/flows/text-to-speech.ts';
