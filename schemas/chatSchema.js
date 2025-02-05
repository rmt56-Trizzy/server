import { errorHandler } from "../helpers/errorHandler.js";
import { Chat } from "../models/Chat.js";

const chatTypeDefs = `#graphql
    type Chat {
        _id: ID
        userId: ID!
        messages: [Message]
    }
    type Message {
        sender: String
        message: String
    }
    input CreateChatInput {
        userMessage: String!
    }
    input SaveChatInput {
        chatId: ID!
        userMessage: String!
    }
    type Query {
        getChatById(_id: ID!): Chat
    }
    type Mutation {
        createChat(payload: CreateChatInput): Chat
        getReplyFromBot(chatId: ID!): Chat
        saveReplyFromUser(payload: SaveChatInput): Chat
    }
`;

const chatResolvers = {
  Query: {
    getChatById: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const { _id } = args;
        const response = await Chat.getChatById(_id, userId);
        return response;
      } catch (error) {
        console.log("🚀 ~ getChatById: ~ error:", error);
        errorHandler(error);
      }
    },
  },
  Mutation: {
    createChat: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const { payload } = args;
        payload.userId = userId;
        const response = await Chat.createChat(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ createChat: ~ error:", error);
        errorHandler(error);
      }
    },
    getReplyFromBot: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const { chatId } = args;
        const response = await Chat.getReplyFromBot({ chatId, userId });
        return response;
      } catch (error) {
        console.log("🚀 ~ getReplyFromBot: ~ error:", error);
        errorHandler(error);
      }
    },
    saveReplyFromUser: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const { payload } = args;
        payload.userId = userId;
        const response = await Chat.saveReplyFromUser(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ saveReplyFromUser: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { chatTypeDefs, chatResolvers };
