import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';

if (!uri) {
  console.error('❌ MONGODB_URI or MONGO_URI is not defined in environment variables!');
}

// Global cached connection helper for Vercel serverless environment
let cachedClient: MongoClient;
let cachedDb: any;

if (uri) {
  cachedClient = new MongoClient(uri);
  cachedDb = cachedClient.db();
} else {
  // Dummy fallback to prevent top-level module crash if env var is missing during build/init
  cachedClient = new MongoClient('mongodb://localhost:27017/jobspark');
  cachedDb = cachedClient.db('jobspark');
}

export const client = cachedClient;
export const db = cachedDb;

export async function connectDB() {
  if (!uri) {
    console.error('❌ Cannot connect to MongoDB: MONGODB_URI/MONGO_URI is missing');
    return;
  }
  try {
    await client.connect();
    console.log('⚡ Connected to MongoDB');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
  }
}
