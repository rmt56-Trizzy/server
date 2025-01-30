import { MongoClient } from "mongodb";
const uri = process.env.MOGODB_URI;

let db = null;
let client = null;

async function connect() {
  try {
    client = new MongoClient(uri);

    db = client.db("trizzy");
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
