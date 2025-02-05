import { getDB } from "../config/mongodb.js";
import { Subscription } from "./Subscription.js";
import { User } from "./User.js";
import { ObjectId } from "mongodb";
import PplxAi from "../helpers/pplxai.js";

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
    }
    if (!userMessage) {
      throw {
        message: "Message cannot be empty",
        code: "BAD_REQUEST",
      };
    }
    // const bot1 = await PplxAi.pplxRequestChat1("Hi");
    // const bot2 = await PplxAi.pplxRequestChat2(userMessage);

    const bot1 = "Hi, how can I help you?";
    const bot2 = "I can help you with that. Please provide more details.";

    const chat = {
      userId,
      messages: [
        {
          sender: "Bot",
          message: bot1,
        },
        { sender: "User", message: userMessage },
        {
          sender: "Bot",
          message: bot2,
        },
      ],
    };

    await collection.insertOne(chat);
    return chat;
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

    const allMessages = chat.messages.map((message) => message.message);
    const allMessagesJoined = allMessages.join(". ");
    // const botMessage = await PplxAi.pplxRequestChat2(allMessagesJoined);
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
