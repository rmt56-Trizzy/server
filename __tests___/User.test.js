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
import { comparePasssword } from "../helpers/bcryptjs.js";
import { ObjectId } from "mongodb";
import { app, startServer } from "../app.js"; // Import your Express app
import { OAuth2Client } from "google-auth-library";
import { userResolvers } from "../schemas/userSchema.js";

jest.mock("google-auth-library");

describe("User Class Integration Tests", () => {
  let db;
  let userCollection;
  let httpServer;

  beforeAll(async () => {
    // Connect to the real MongoDB database
    process.env.PORT = 3006;
    httpServer = await startServer();
    db = getDB();
    userCollection = db.collection("Users");
  });

  beforeEach(async () => {
    // Clear the Users collection before each test
    await userCollection.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup: Remove test data
    await userCollection.deleteMany({});
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
      console.log("🛑 Test Server stopped");
    }
  });

  describe("register", () => {
    it("should throw an error if fullName is missing", async () => {
      const payload = {
        email: "test@example.com",
        password: "password123",
      };
      try {
        await User.register(payload);
      } catch (error) {
        expect(error.message).toBe("Full name is required");
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if email is missing", async () => {
      const payload = {
        fullName: "Test User",
        password: "password123",
      };
      try {
        await User.register(payload);
      } catch (error) {
        expect(error.message).toBe("Email is required");
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if email format is invalid", async () => {
      const payload = {
        fullName: "Test User",
        email: "invalid-email",
        password: "password123",
      };
      try {
        await User.register(payload);
      } catch (error) {
        expect(error.message).toBe("Invalid email format");
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if email is already in use", async () => {
      const input = {
        email: "new@example.com",
        fullName: "New User",
        password: "password123",
      };

      await userResolvers.Mutation.register(null, { input });

      try {
        await userResolvers.Mutation.register(null, { input });
      } catch (error) {
        expect(error.message).toBe("Email already registered");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if password is missing", async () => {
      const payload = {
        fullName: "Test User",
        email: "test@example.com",
      };
      try {
        await User.register(payload);
      } catch (error) {
        expect(error.message).toBe("Password is required");
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if password is not strong enough", async () => {
      const payload = {
        fullName: "Test User",
        email: "test@example.com",
        password: "123",
      };
      try {
        await User.register(payload);
      } catch (error) {
        expect(error.message).toBe("Password is not strong enough");
        expect(error.code).toBe("BAD_REQUEST");
      }
    });

    it("should register a new user", async () => {
      const input = {
        email: "new@example.com",
        fullName: "New User",
        password: "password123",
      };

      const response = await userResolvers.Mutation.register(null, { input });
      expect(response).toBe("Register successful");

      // Verify the user was inserted into the database
      const user = await userCollection.findOne({ email: input.email });
      expect(user).toBeDefined();
      expect(user.fullName).toBe(input.fullName);
      expect(user.email).toBe(input.email);
      expect(user.freeTrial).toBe(3);
      expect(comparePasssword(input.password, user.password)).toBe(true);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Create a user before each login test
      const payload = {
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      await User.register(payload);
    });

    it("should throw an error if email is missing", async () => {
      const payload = {
        password: "password123",
      };
      try {
        await userResolvers.Mutation.login(null, { login: payload });
      } catch (error) {
        expect(error.message).toBe("Email is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if password is missing", async () => {
      const payload = {
        email: "test@example.com",
      };
      try {
        await userResolvers.Mutation.login(null, { login: payload });
      } catch (error) {
        expect(error.message).toBe("Password is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if email is incorrect", async () => {
      const payload = {
        email: "wrong@example.com",
        password: "password123",
      };
      try {
        await userResolvers.Mutation.login(null, { login: payload });
      } catch (error) {
        expect(error.message).toBe("Invalid email or password");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if password is incorrect", async () => {
      const payload = {
        email: "test@example.com",
        password: "wrongpassword",
      };
      try {
        await userResolvers.Mutation.login(null, { login: payload });
      } catch (error) {
        expect(error.message).toBe("Invalid email or password");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should login a user", async () => {
      const input = {
        email: "new@example.com",
        fullName: "New User",
        password: "password123",
      };

      await userResolvers.Mutation.register(null, { input });

      const login = {
        email: "new@example.com",
        password: "password123",
      };

      const response = await userResolvers.Mutation.login(null, { login });
      expect(response).toEqual(
        expect.objectContaining({
          access_token: expect.any(String),
        })
      );
    });
  });

  describe("googleLogin", () => {
    it("should login successfully with a valid Google token", async () => {
      const mockToken = "mockGoogleToken";
      const mockPayload = {
        sub: "googleUserId",
        name: "Google User",
        email: "googleuser@example.com",
      };

      const mockTicket = {
        getPayload: () => mockPayload,
      };

      OAuth2Client.prototype.verifyIdToken = jest
        .fn()
        .mockResolvedValue(mockTicket);

      const response = await userResolvers.Mutation.googleLogin(null, {
        token: mockToken,
      });

      expect(response).toHaveProperty("access_token");
      expect(response).toHaveProperty("userId");

      // Verify the user was inserted into the database
      const user = await userCollection.findOne({ email: mockPayload.email });
      expect(user).toBeDefined();
      expect(user.fullName).toBe(mockPayload.name);
      expect(user.email).toBe(mockPayload.email);
      expect(user.freeTrial).toBe(3);
    });

    it("should throw an error if the Google token is invalid", async () => {
      const mockToken = "invalidGoogleToken";

      OAuth2Client.prototype.verifyIdToken = jest.fn().mockResolvedValue(null);

      try {
        await userResolvers.Mutation.googleLogin(null, { token: mockToken });
      } catch (error) {
        expect(error.message).toBe("Invalid token");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("getUserById", () => {
    beforeEach(async () => {
      // Create a user before each getUserById test
      const payload = {
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      await userResolvers.Mutation.register(null, { input: payload });
    });

    it("should return user data if user is found", async () => {
      const user = await userCollection.findOne({ email: "test@example.com" });
      const result = await userResolvers.Query.getUserById(null, {
        _id: user._id,
      });
      expect(result).toBeDefined();
      expect(result.email).toBe("test@example.com");
    });

    it("should throw an error if user is not found", async () => {
      try {
        await userResolvers.Query.getUserById(null, { _id: new ObjectId() });
      } catch (error) {
        expect(error.message).toBe("User not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("deductFreeTrial", () => {
    beforeEach(async () => {
      // Create a user before each deductFreeTrial test
      const payload = {
        fullName: "Test User",
        email: "test@example.com",
        password: "password123",
      };
      await User.register(payload);
    });

    it("should deduct free trial successfully", async () => {
      const user = await userCollection.findOne({ email: "test@example.com" });
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: user._id }),
      };
      const result = await userResolvers.Mutation.deductFreeTrial(
        null,
        null,
        context
      );
      expect(result).toBe(2);

      const updatedUser = await userCollection.findOne({ _id: user._id });
      expect(updatedUser.freeTrial).toBe(2);
    });

    it("should throw an error if free trial is over", async () => {
      const user = await userCollection.findOne({ email: "test@example.com" });
      await userCollection.updateOne(
        { _id: user._id },
        { $set: { freeTrial: 0 } }
      );

      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: user._id }),
      };

      try {
        await userResolvers.Mutation.deductFreeTrial(null, null, context);
      } catch (error) {
        expect(error.message).toBe(
          "Your free trial is over. Please subscribe to start a new chat."
        );
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });

    it("should throw an error if user is not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: new ObjectId() }),
      };

      try {
        await userResolvers.Mutation.deductFreeTrial(null, null, context);
      } catch (error) {
        expect(error.message).toBe("User not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });

    it("should throw an error if freeTrial is already zero", async () => {
      const user = await userCollection.findOne({ email: "test@example.com" });
      await userCollection.updateOne(
        { _id: user._id },
        { $set: { freeTrial: 0 } }
      );

      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: user._id }),
      };

      try {
        await userResolvers.Mutation.deductFreeTrial(null, null, context);
      } catch (error) {
        expect(error.message).toBe(
          "Your free trial is over. Please subscribe to start a new chat."
        );
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });
});
