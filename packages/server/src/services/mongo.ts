// src/services/mongo.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

mongoose.set("debug", true);
dotenv.config();

function getMongoURI(dbname: string): string {
  const { MONGO_USER, MONGO_PWD, MONGO_CLUSTER } = process.env;

  if (MONGO_USER && MONGO_PWD && MONGO_CLUSTER) {
    console.log(
      "Connecting to MongoDB Atlas at",
      `mongodb+srv://${MONGO_USER}@${MONGO_CLUSTER}/${dbname}`
    );
    return `mongodb+srv://${MONGO_USER}:${MONGO_PWD}@${MONGO_CLUSTER}/${dbname}?retryWrites=true&w=majority`;
  }

  const local = `mongodb://localhost:27017/${dbname}`;
  console.log("Connecting to local MongoDB at", local);
  return local;
}

export function connect(dbname: string) {
  mongoose
    .connect(getMongoURI(dbname))
    .then(() => console.log("✓ MongoDB connected successfully"))
    .catch((err) => console.error("✗ MongoDB connection error:", err));
}
