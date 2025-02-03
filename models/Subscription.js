import { ObjectId } from "mongodb";
import { getDB } from "../config/mongodb.js";

export class Subscription {
  static getCollection() {
    const db = getDB();
    const collection = db.collection("Subscriptions");
    return collection;
  }

  static async addSubscription(payload) {
    const { userId, midtransId, price } = payload;
    const collection = this.getCollection();

    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }

    if (!midtransId) {
      throw {
        message: "Transaction Failed",
        code: "BAD_REQUEST",
      };
    }

    const subscription = await this.isSubscribed(userId);
    if (subscription) {
      throw {
        message: "You are already subscribed",
        code: "BAD_REQUEST",
      };
    }

    const transactionTime = new Date();
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(
      new Date(startDate).setMonth(new Date(startDate).getMonth() + 1)
    )
      .toISOString()
      .split("T")[0];

    await collection.insertOne({
      userId,
      midtransId,
      price,
      startDate,
      endDate,
      transactionTime,
      status: "pending",
    });
    return "Subscription added successfully";
  }

  static async getSubscription(userId) {
    const collection = this.getCollection();

    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }

    const subscription = await collection.findOne(
      { userId: new ObjectId(userId) },
      { sort: { transactionTime: -1 } }
    );
    console.log(
      "🚀 ~ Subscription ~ getSubscription ~ subscription:",
      subscription
    );

    return subscription;
  }

  static async isSubscribed(userId) {
    const subscription = await this.getSubscription(userId);
    if (subscription && subscription.status === "paid") {
      const currentDate = new Date();
      const startDate = new Date(subscription.startDate);
      const endDate = new Date(subscription.endDate);
      if (currentDate >= startDate && currentDate <= endDate) {
        return true;
      } else {
        console.log(
          `❌ Subscription expired: Order ID ${subscription.midtransId}`
        );
        return false;
      }
    }
    return false;
  }

  // update Subscription.status upon receive update from webhook
  static async updateSubscriptionStatus(midtransId, newStatus) {
    const collection = this.getCollection();
    await collection.updateOne({ midtransId }, { $set: { status: newStatus } });
  }
}
