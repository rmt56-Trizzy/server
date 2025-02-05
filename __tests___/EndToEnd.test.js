import request from "supertest";
import { app, startServer } from "../app.js";
import { ApolloServer } from "@apollo/server";
import { User } from "../models/User";
import { Subscription } from "../models/Subscription";
import { verifyToken } from "../helpers/jwt";
import {
  expect,
  it,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import crypto from "crypto";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import http from "http";

jest.mock("@apollo/server");
jest.mock("@apollo/server/express4");
jest.mock("../models/User");
jest.mock("../models/Subscription");
jest.mock("../helpers/jwt");
jest.mock("http", () => ({
  ...jest.requireActual("http"),
  createServer: jest.fn(() => ({
    listen: jest.fn(),
  })),
}));
// Mock expressMiddleware
const mockExpressMiddleware = jest.fn();
jest.mock("@apollo/server/express4", () => ({
  expressMiddleware: (...args) => mockExpressMiddleware(...args),
}));

describe("GraphQL Server and Webhook Tests", () => {
  let server;

  beforeAll(async () => {
    process.env.PORT = 3005;
    server = await startServer();
  });

  afterAll(async () => {
    await server?.stop();
  });

  //   describe("GraphQL Endpoint", () => {
  //     it("should respond to GraphQL queries", async () => {
  //       const response = await request(app).post("/graphql").send({
  //         query: "{ hello }",
  //       });

  //       expect(response.status).toBe(200);
  //       expect(response.body.data).toBeDefined();
  //     });

  //     it("should handle authentication", async () => {
  //       const mockUser = { id: "123", name: "Test User" };
  //       verifyToken.mockReturnValue({ userId: "123" });
  //       User.getUserById.mockResolvedValue(mockUser);

  //       const response = await request(app)
  //         .post("/graphql")
  //         .set("Authorization", "Bearer fake_token")
  //         .send({
  //           query: "{ currentUser { id name } }",
  //         });

  //       expect(response.status).toBe(200);
  //       expect(response.body.data.currentUser).toEqual(mockUser);
  //     });
  //   });

  describe("Midtrans Webhook", () => {
    it("should process valid webhook data", async () => {
      const orderId = "order123";
      const statusCode = "200";
      const grossAmount = "100000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      const signatureKey = crypto
        .createHash("sha512")
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest("hex");

      const mockUpdateSubscriptionStatus = jest.spyOn(
        Subscription,
        "updateSubscriptionStatus"
      );

      const response = await request(app).post("/midtrans-webhook").send({
        transaction_status: "settlement",
        fraudStatus: "accept",
        signature_key: signatureKey,
        status_code: statusCode,
        order_id: orderId,
        gross_amount: grossAmount,
      });

      expect(response.status).toBe(200);
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
        orderId,
        "paid"
      );
    });

    it("should reject webhook with invalid signature", async () => {
      const response = await request(app).post("/midtrans-webhook").send({
        transaction_status: "settlement",
        fraudStatus: "accept",
        signature_key: "invalid_signature",
        status_code: "200",
        order_id: "order123",
        gross_amount: "100000",
      });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Invalid signature");
    });

    it("should handle failed payments", async () => {
      const orderId = "failedOrder123";
      const statusCode = "200";
      const grossAmount = "100000";
      const serverKey = process.env.MIDTRANS_SERVER_KEY;

      const signatureKey = crypto
        .createHash("sha512")
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest("hex");

      const mockUpdateSubscriptionStatus = jest.spyOn(
        Subscription,
        "updateSubscriptionStatus"
      );

      const response = await request(app).post("/midtrans-webhook").send({
        transaction_status: "expire",
        fraudStatus: "accept",
        signature_key: signatureKey,
        status_code: statusCode,
        order_id: orderId,
        gross_amount: grossAmount,
      });

      expect(response.status).toBe(200);
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(
        orderId,
        "paymentFailed"
      );
    });
  });
});

// describe("Server Start and Authentication Tests", () => {
//   let app, httpServer, server, mockListen;

//   beforeEach(() => {
//     jest.clearAllMocks();

//     app = express();
//     httpServer = http.createServer(app);
//     server = new ApolloServer({
//       typeDefs: `
//         type Query {
//           _empty: String
//         }
//       `,
//       resolvers: {
//         Query: {
//           _empty: () => null,
//         },
//       },
//     });
//     mockListen = jest.fn();
//     httpServer.listen = mockListen;
//     server.start = jest.fn().mockResolvedValue();
//   });

//   it("should start the server successfully", async () => {
//     await startServer();

//     expect(server.start).toHaveBeenCalled();
//     expect(mockExpressMiddleware).toHaveBeenCalledWith(
//       server,
//       expect.any(Object)
//     );
//     expect(mockListen).toHaveBeenCalled();
//   });

//   it("should set up authentication middleware", async () => {
//     await startServer();

//     expect(mockExpressMiddleware).toHaveBeenCalledWith(
//       server,
//       expect.objectContaining({
//         context: expect.any(Function),
//       })
//     );
//   });

//   describe("Authentication Middleware", () => {
//     let authMiddleware;

//     beforeEach(async () => {
//       await startServer();
//       authMiddleware = mockExpressMiddleware.mock.calls[0][1].context;
//     });

//     it("should throw an error if no authorization header is present", async () => {
//       const req = { headers: {} };
//       await expect(authMiddleware({ req })).rejects.toThrow(
//         "You must be logged in"
//       );
//     });

//     it("should throw an error for invalid token", async () => {
//       const req = { headers: { authorization: "Bearer invalid_token" } };
//       verifyToken.mockReturnValue({});
//       await expect(authMiddleware({ req })).rejects.toThrow("Invalid token");
//     });

//     it("should throw an error if user is not found", async () => {
//       const req = { headers: { authorization: "Bearer valid_token" } };
//       verifyToken.mockReturnValue({ userId: "user_id" });
//       User.getUserById.mockResolvedValue(null);
//       await expect(authMiddleware({ req })).rejects.toThrow("Invalid token");
//     });

//     it("should return user data without password for valid token", async () => {
//       const req = { headers: { authorization: "Bearer valid_token" } };
//       verifyToken.mockReturnValue({ userId: "user_id" });
//       User.getUserById.mockResolvedValue({
//         id: "user_id",
//         name: "Test User",
//         password: "secret",
//       });

//       const context = await authMiddleware({ req });
//       const user = await context.authentication();

//       expect(user).toEqual({ id: "user_id", name: "Test User" });
//       expect(user).not.toHaveProperty("password");
//     });
//   });

//   it("should log server start messages", async () => {
//     const consoleSpy = jest.spyOn(console, "log").mockImplementation();

//     await startServer();

//     expect(consoleSpy).toHaveBeenCalledWith(
//       expect.stringContaining("GraphQL Server ready")
//     );
//     expect(consoleSpy).toHaveBeenCalledWith(
//       expect.stringContaining("Webhook running")
//     );

//     consoleSpy.mockRestore();
//   });
// });
