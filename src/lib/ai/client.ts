import OpenAI from "openai";

// Ensure OPENAI_API_KEY is in .env
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Optional: organization, helper if needed
});
