import { getDB } from "../config/mongodb.js";
import { User } from "./User.js";
import { ObjectId } from "mongodb";

export class Recommendation {
  static getGeneralCollection() {
    const db = getDB();
    const collection = db.collection("GeneralRecommendations");
    return collection;
  }

  static async getGeneralRecommendations() {
    const collection = this.getGeneralCollection();
    const response = await collection.find({}).toArray();
    return response;
  }

  static async getGeneralRecommendationDetails(id) {
    const collection = this.getGeneralCollection();
    const response = await collection.findOne({ _id: new ObjectId(id) });
    return response;
  }

  static getCollection() {
    const db = getDB();
    const collection = db.collection("Recommendations");
    return collection;
  }
}
