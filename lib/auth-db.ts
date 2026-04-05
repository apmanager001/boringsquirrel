import { Db, MongoClient } from "mongodb";
import { env } from "@/lib/env";

declare global {
  var __boringSquirrelMongoClient: MongoClient | undefined;
  var __boringSquirrelMongoClientPromise: Promise<MongoClient> | undefined;
}

function createMongoClient() {
  return new MongoClient(env.mongoUri!);
}

export function getMongoClientInstance() {
  if (!env.mongoUri) {
    return null;
  }

  global.__boringSquirrelMongoClient ??= createMongoClient();
  return global.__boringSquirrelMongoClient;
}

export function getMongoDatabase(): Db | null {
  const client = getMongoClientInstance();

  if (!client) {
    return null;
  }

  return client.db();
}

export async function connectMongoClient() {
  const client = getMongoClientInstance();

  if (!client) {
    return null;
  }

  global.__boringSquirrelMongoClientPromise ??= client
    .connect()
    .then(() => client);

  return global.__boringSquirrelMongoClientPromise;
}
