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
import {
  createTransaction,
  getTransactionStatus,
} from "../helpers/midtrans.js";
import e from "express";

describe("Subscription Class Integration Tests", () => {
  let db;
  let userCollection;
  let chatCollection;
  let subscriptionCollection;
  let httpServer;
  let userId;
  let chatId;
  let access_token;
  let input;
  let response;
  let midtransId;
  let subscriptionId;
  let price = 189000;

  beforeAll(async () => {
    // Connect to the real MongoDB database
    process.env.PORT = 3007;
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

  describe("Add Subscription", () => {
    it("should create a new subscription", async () => {
      const payload = {
        midtransId: "SUB-67a3402657623c8b4a1954e3-1738760714467",
        price: price,
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await subscriptionResolvers.Mutation.addSubscription(
        null,
        {
          payload,
        },
        context
      );
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThanOrEqual(20);
    });

    it("should throw an error if user is not logged in", async () => {
      const payload = {
        midtransId: "SUB-67a3402657623c8b4a1954e3-1738760714467",
        price: price,
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await subscriptionResolvers.Mutation.addSubscription(
          null,
          { payload },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if subscription is invalid", async () => {
      const payload = {
        midtransId: "",
        price: price,
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await subscriptionResolvers.Mutation.addSubscription(
          null,
          { payload },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Transaction Failed");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if subscription already exists", async () => {
      const payload = {
        midtransId: "SUB-67a3402657623c8b4a1954e3-1738760714467",
        price: price,
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await subscriptionResolvers.Mutation.addSubscription(
          null,
          { payload },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You are already subscribed");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Get Subscription", () => {
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await subscriptionResolvers.Query.getSubscription(null, null, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if subscription is not found", async () => {
      const context = {
        authentication: jest
          .fn()
          .mockResolvedValue({ _id: "67a2e47057623c8b4a1954d7" }),
      };
      try {
        await subscriptionResolvers.Query.getSubscription(null, null, context);
      } catch (error) {
        expect(error.message).toBe("Subscription not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });

    it("should get the subscription", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await subscriptionResolvers.Query.getSubscription(
        null,
        null,
        context
      );
      //   console.log(result);
      expect(result).toHaveProperty("userId");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("midtransId");
      expect(result).toHaveProperty("_id");
      midtransId = result.midtransId;
      subscriptionId = result._id;
    });
  });

  describe("Check Subscription", () => {
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await subscriptionResolvers.Query.isSubscribed(null, null, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should check if user is subscribed", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await subscriptionResolvers.Query.isSubscribed(
        null,
        null,
        context
      );
      expect(result).toBe(true);
    });
  });

  describe("Payment failed", () => {
    //the endDate has passed
    it("should return expired", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      await subscriptionCollection.updateOne(
        {
          _id: subscriptionId,
        },
        {
          $set: {
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          },
        }
      );
      const result = await subscriptionResolvers.Query.isSubscribed(
        null,
        null,
        context
      );
      expect(result).toBe(false);
    });

    it("should return payment failed", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      await subscriptionCollection.updateOne(
        { _id: subscriptionId },
        {
          $set: {
            status: "pending",
            midtransId: "SUB-67a",
          },
        }
      );
      const result = await subscriptionResolvers.Query.getSubscription(
        null,
        null,
        context
      );
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("midtransId");
      expect(result).toHaveProperty("_id");
      expect(result.status).toBe("paymentFailed");
    });
    it("should return payment failed", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      await subscriptionCollection.updateOne(
        { _id: subscriptionId },
        {
          $set: {
            status: "pending",
            midtransId: null,
          },
        }
      );
      try {
        const result = await subscriptionResolvers.Query.getSubscription(
          null,
          null,
          context
        );
      } catch (error) {
        expect(error.extensions.code).toBe("INTERNAL_SERVER_ERROR");
      }
    });
    it("should failed creating transaction", async () => {
      const payload = {
        midtransId: "SUB-67a3402657623c8b4a1954e3-1738760714467",
        price: null,
      };
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        const result = await subscriptionResolvers.Mutation.addSubscription(
          null,
          {
            payload,
          },
          context
        );
      } catch (error) {
        expect(error.extensions.code).toBe("INTERNAL_SERVER_ERROR");
      }
    });
  });
});
