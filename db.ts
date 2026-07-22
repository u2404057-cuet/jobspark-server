import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || '';

let client: MongoClient;
let db: Db;
let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
} else {
  console.error('❌ MONGODB_URI or MONGO_URI is not defined in environment variables!');
  client = new MongoClient('mongodb://localhost:27017/jobspark');
}

db = client.db('jobspark');

export async function connectDB(): Promise<Db> {
  if (!uri) {
    console.error('❌ Cannot connect to MongoDB: MONGODB_URI/MONGO_URI is missing');
    return db;
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      return client;
    })();
  }

  try {
    await clientPromise;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    clientPromise = null;
  }

  return db;
}

export { client, db };
