import { getDB } from "../config/mongodb.js";
import { Subscription } from "./Subscription.js";
import { User } from "./User.js";
import { ObjectId } from "mongodb";

export class Chat {
  static getCollection() {
    const db = getDB();
    const collection = db.collection("Chats");
    return collection;
  }

  static async getChatById(_id, userId) {
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!_id) {
      throw {
        message: "Chat ID is required",
        code: "BAD_REQUEST",
      };
    }
    const response = await collection.findOne({
      _id: new ObjectId(_id),
      userId: new ObjectId(userId),
    });
    if (!response) {
      throw {
        message: "Chat not found",
        code: "NOT_FOUND",
      };
    }
    return response;
  }

  static async createChat(payload) {
    const { userId, userMessage } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }

    //check if user is subscribed
    const isSubscribed = await Subscription.isSubscribed(userId);
    if (!isSubscribed) {
      //check if freeTrial > 0, if yes, then allow user to chat and deduct freeTrial
      //if no, then throw error
      const user = await User.getUserById(userId);
      if (user.freeTrial > 0) {
        await User.deductFreeTrial(userId);
      } else {
        throw {
          message:
            "Your free trial is over. Please subscribe to start a new chat.",
          code: "BAD_REQUEST",
        };
      }

      if (!userMessage) {
        throw {
          message: "Message cannot be empty",
          code: "BAD_REQUEST",
        };
      }

      const chat = {
        userId,
        messages: [
          {
            sender: "Bot",
            message: "Hi, I am Velzy. How can I assist you today?",
          },
          { sender: "User", message: userMessage },
          {
            sender: "Bot",
            message: "Sure, what kind of activity are you interested in?",
          },
        ],
      };

      await collection.insertOne(chat);
      return chat;
    }
  }

  static async getReplyFromBot(payload) {
    const { userId, chatId } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!chatId) {
      throw {
        message: "Chat ID is required",
        code: "BAD_REQUEST",
      };
    }
    const chat = await collection.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      throw {
        message: "Chat not found",
        code: "NOT_FOUND",
      };
    }
    if (chat.userId.toString() !== userId.toString()) {
      throw {
        message: "You are not authorized to save this chat",
        code: "UNAUTHORIZED",
      };
    }

    const botMessage = "How many days are you planning for your trip?";
    const newMessages = [{ sender: "Bot", message: botMessage }];
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, ...newMessages],
    };
    await collection.updateOne(
      { _id: new ObjectId(chatId) },
      { $set: updatedChat }
    );
    return updatedChat;
  }

  static async saveReplyFromUser(payload) {
    const { userId, chatId, userMessage } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!userMessage) {
      throw {
        message: "Messages cannot be empty",
        code: "BAD_REQUEST",
      };
    }
    if (!chatId) {
      throw {
        message: "Chat ID is required",
        code: "BAD_REQUEST",
      };
    }
    const chat = await collection.findOne({ _id: new ObjectId(chatId) });
    if (!chat) {
      throw {
        message: "Chat not found",
        code: "NOT_FOUND",
      };
    }
    if (chat.userId.toString() !== userId.toString()) {
      throw {
        message: "You are not authorized to save this chat",
        code: "UNAUTHORIZED",
      };
    }
    const newMessages = [{ sender: "User", message: userMessage }];
    const updatedChat = {
      ...chat,
      messages: [...chat.messages, ...newMessages],
    };
    await collection.updateOne(
      { _id: new ObjectId(chatId) },
      { $set: updatedChat }
    );
    return updatedChat;
  }
}
