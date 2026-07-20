import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  throw new Error('MONGODB_URI or MONGO_URI is not defined in the environment variables');
}

// Global cached connection helper for Vercel serverless environment
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

if (!cachedClient) {
  cachedClient = new MongoClient(uri);
  cachedDb = cachedClient.db(); // Uses the database name from the connection string
}

export const client = cachedClient;
export const db = cachedDb;

export async function connectDB() {
  console.log('⚡ Database initialized (auto-connect enabled)');
}
