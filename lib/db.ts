import mongoose from "mongoose";
import { env } from "@/lib/env";

declare global {
  var __boringSquirrelMongoosePromise: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase() {
  if (!env.mongoUri) {
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (
    mongoose.connection.readyState === 2 &&
    global.__boringSquirrelMongoosePromise
  ) {
    return global.__boringSquirrelMongoosePromise;
  }

  global.__boringSquirrelMongoosePromise ??= mongoose
    .connect(env.mongoUri, {
      bufferCommands: false,
    })
    .catch((error) => {
      global.__boringSquirrelMongoosePromise = undefined;
      throw error;
    });

  return global.__boringSquirrelMongoosePromise;
}
