import { GoogleGenAI } from '@google/genai';

export function getGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in server/.env');
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}
