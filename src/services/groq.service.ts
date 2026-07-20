import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY || '';
export const groq = new Groq({ apiKey });

// Standard versatile Llama model on Groq
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
