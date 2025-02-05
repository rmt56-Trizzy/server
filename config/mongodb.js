import { MongoClient } from "mongodb";
import { config } from "dotenv";

const uri = process.env.MONGODB_URI;

let db = null;
let client = null;

async function connect() {
  console.log("🚀 ~ connecting..");
  try {
    client = new MongoClient(uri);
    console.log(uri);
    const environment = process.env.NODE_ENV || "development";
    console.log("🚀 ~ connecting to ~ db: ", environment);
    switch (environment) {
      case "test":
        console.log("🚀 ~ connecting to ~ db: test");
        db = client.db("test");
        break;
      case "production":
        console.log("🚀 ~ connecting to ~ db: public");
        db = client.db("public");
        break;
      case "development":
        console.log("🚀 ~ connecting to ~ db: trizzy");
        db = client.db("trizzy");
        break;
    }
    // db = client.db("trizzy");
    console.log("🚀 ~ connected");
    return db;
  } catch (err) {
    console.log("🚀 ~ connect ~ err:", err);
  }
}

const getDB = () => {
  if (!db) connect();

  return db;
};

export { getDB, client };
