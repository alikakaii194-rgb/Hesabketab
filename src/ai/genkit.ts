
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// This file is the central point for Genkit configuration.
// By initializing it here, we ensure that Genkit is configured once
// and this configured instance is used throughout the application.
// It does NOT contain 'use server' because it exports a plain object.

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1', // Force the stable API version
    }),
  ],
});
