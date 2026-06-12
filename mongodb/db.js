import { MongoClient } from "mongodb";

let uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  // Use a dummy URI to prevent Vercel build crashes during "Collecting page data" 
  // Next.js will catch connection failures and mark pages as dynamic, but won't crash.
  uri = "mongodb+srv://dummy:dummy@cluster0.dummy.mongodb.net/test";
  console.warn("Please add your Mongo URI to Vercel environment variables. Using a dummy URI for build.");
}

if (process.env.NODE_ENV === "development") {
  // Use a global variable to preserve the value across module reloads in development
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;