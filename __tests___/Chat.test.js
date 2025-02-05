import { getDB } from "../config/mongodb.js";
import {
  expect,
  it,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import { User } from "../models/User.js";
import { Chat } from "../models/Chat.js";
import { Subscription } from "../models/Subscription.js";
import { hashPassword, comparePasssword } from "../helpers/bcryptjs.js";
import { signToken } from "../helpers/jwt.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import request from "supertest"; // For making HTTP requests
import { app, startServer } from "../app.js"; // Import your Express app
import { OAuth2Client } from "google-auth-library";
import { userTypeDefs, userResolvers } from "../schemas/userSchema.js";
import { chatTypeDefs, chatResolvers } from "../schemas/chatSchema.js";
import {
  subscriptionTypeDefs,
  subscriptionResolvers,
} from "../schemas/subscriptionSchema.js";

import PplxAi from "../helpers/pplxai.js";

beforeEach(() => {
  jest.restoreAllMocks();
});

const message = "Hello Josh";

jest.mock("../helpers/pplxai.js", () => {
  return {
    pplxRequestChat1: jest.fn().mockResolvedValue("Hello Josh"),
    pplxRequestChat2: jest.fn().mockResolvedValue("Hello Josh"),
  };
});

describe("Chat Class Integration Tests", () => {
  let db;
  let chatCollection;
  let userCollection;
  let subscriptionCollection;
  let httpServer;
  let userId;
  let chatId;
  let access_token;
  let input;
  let response;

  beforeAll(async () => {
    // Connect to the real MongoDB database
    process.env.PORT = 3009;
    httpServer = await startServer();
    db = getDB();
    chatCollection = db.collection("Chats");
    userCollection = db.collection("Users");
    subscriptionCollection = db.collection("Subscriptions");

    //try register user
    input = {
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    response = await userResolvers.Mutation.register(null, {
      input,
    });

    response = await userResolvers.Mutation.login(null, {
      login: {
        email: input.email,
        password: input.password,
      },
    });
    userId = response.userId;
    access_token = response.access_token;
  });

  //   beforeEach(async () => {
  //     // Clear the Users collection before each test
  //     await chatCollection.deleteMany({});
  //     await userCollection.deleteMany({});
  //     await subscriptionCollection.deleteMany({});
  //   });

  afterAll(async () => {
    // Cleanup: Remove test data
    await chatCollection.deleteMany({});
    await userCollection.deleteMany({});
    await subscriptionCollection.deleteMany({});
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));

      console.log("🛑 Test Server stopped");
    }
  });

  //   test("should first", async () => {
  //     jest.spyOn(PplxAi, "pplxRequestChat1").mockResolvedValueOnce(message);
  //     const result = await PplxAi.pplxRequestChat1("Hi I am Josh");
  //     console.log(result);
  //     expect(result).toBe(message);
  //   });

  //   test("should first", async () => {
  //     jest.spyOn(PplxAi, "pplxRequestChat2").mockResolvedValueOnce(message);
  //     const result = await PplxAi.pplxRequestChat2("Hi I am Josh.");
  //     console.log(result);
  //     expect(result).toBe(message);
  //   });

  describe("Create Chat", () => {
    it("should create a new chat", async () => {
      const payload = {
        userMessage: "Hi",
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await chatResolvers.Mutation.createChat(
        null,
        { payload },
        context
      );
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("_id");
      chatId = result._id;
    }, 60000);

    it("should throw an error if user is not logged in", async () => {
      const payload = {
        userMessage: "Hi",
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await chatResolvers.Mutation.createChat(null, { payload }, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if userMessage is missing", async () => {
      const payload = { userMessage: "" };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await chatResolvers.Mutation.createChat(null, { payload }, context);
      } catch (error) {
        expect(error.message).toBe("Message cannot be empty");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if free trial is over", async () => {
      const payload = {
        userMessage: "Hi",
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      await userCollection.updateOne(
        { _id: userId },
        { $set: { freeTrial: 0 } }
      );
      try {
        await chatResolvers.Mutation.createChat(null, { payload }, context);
      } catch (error) {
        expect(error.message).toBe(
          "Your free trial is over. Please subscribe to start a new chat."
        );
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Save reply from user", () => {
    it("should save the reply from the user", async () => {
      const payload = {
        chatId: chatId,
        userMessage: "I want to go to europe.",
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
      //   console.log(result);
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("_id");
    });
  });

  it("should throw an error if user is not logged in", async () => {
    const payload = {
      chatId: chatId,
      userMessage: "I want to go to europe.",
    };
    const context = {
      authentication: jest.fn().mockResolvedValue({ _id: null }),
    };
    try {
      await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
    } catch (error) {
      expect(error.message).toBe("You must be logged in");
      expect(error.extensions.code).toBe("UNAUTHORIZED");
    }
  });

  it("should throw an error if userMessage is missing", async () => {
    const payload = {
      chatId: chatId,
      userMessage: "",
    };
    const context = {
      authentication: jest.fn().mockResolvedValue({ _id: userId }),
    };
    try {
      await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
    } catch (error) {
      expect(error.message).toBe("Messages cannot be empty");
      expect(error.extensions.code).toBe("BAD_REQUEST");
    }
  });

  it("should throw an error if chatId is missing", async () => {
    const payload = {
      chatId: "",
      userMessage: "I want to go to europe.",
    };
    const context = {
      authentication: jest.fn().mockResolvedValue({ _id: userId }),
    };
    try {
      await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
    } catch (error) {
      expect(error.message).toBe("Chat ID is required");
      expect(error.extensions.code).toBe("BAD_REQUEST");
    }
  });

  it("should throw an error if chatId is invalid", async () => {
    const payload = {
      chatId: "67a3a5654a7dc7045c666581",
      userMessage: "I want to go to europe.",
    };
    const context = {
      authentication: jest.fn().mockResolvedValue({ _id: userId }),
    };
    try {
      await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
    } catch (error) {
      expect(error.message).toBe("Chat not found");
      expect(error.extensions.code).toBe("NOT_FOUND");
    }
  });

  it("should throw an error if user is not the owner of the chat", async () => {
    const payload = {
      chatId: chatId,
      userMessage: "I want to go to europe.",
    };
    const context = {
      authentication: jest
        .fn()
        .mockResolvedValue({ _id: "67a345a38cce8c5a212f00cb" }),
    };
    try {
      await chatResolvers.Mutation.saveReplyFromUser(
        null,
        { payload },
        context
      );
    } catch (error) {
      expect(error.message).toBe("You are not authorized to save this chat");
      expect(error.extensions.code).toBe("UNAUTHORIZED");
    }
  });

  describe("Get reply from bot", () => {
    it("should get the reply from the bot", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await chatResolvers.Mutation.getReplyFromBot(
        null,
        { chatId },
        context
      );
      console.log(result);
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("_id");
    });

    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await chatResolvers.Mutation.getReplyFromBot(null, { chatId }, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if chatId is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await chatResolvers.Mutation.getReplyFromBot(
          null,
          { chatId: "" },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if chatId is invalid", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await chatResolvers.Mutation.getReplyFromBot(
          null,
          { chatId: "67a3a5654a7dc7045c666581" },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });

    it("should throw an error if user is not the owner of the chat", async () => {
      const context = {
        authentication: jest
          .fn()
          .mockResolvedValue({ _id: "67a345a38cce8c5a212f00cb" }),
      };
      try {
        await chatResolvers.Mutation.getReplyFromBot(null, { chatId }, context);
      } catch (error) {
        expect(error.message).toBe("You are not authorized to save this chat");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("Get chats", () => {
    it("should get  chats", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await chatResolvers.Query.getChatById(
        null,
        { _id: chatId },
        context
      );
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("messages");
      expect(result).toHaveProperty("_id");
    });

    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await chatResolvers.Query.getChatById(null, { _id: chatId }, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if chatId is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await chatResolvers.Query.getChatById(null, { _id: "" }, context);
      } catch (error) {
        expect(error.message).toBe("Chat ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if chatId is invalid", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await chatResolvers.Query.getChatById(
          null,
          { _id: "67a3a5654a7dc7045c666581" },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });
});
