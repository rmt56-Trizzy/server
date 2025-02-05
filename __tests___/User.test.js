import { getDB } from "../config/mongodb.js";
import { expect, it, describe } from "@jest/globals";

import User from "../models/User.js";
import { hashPassword, comparePasssword } from "../helpers/bcryptjs.js";
import { signToken } from "../helpers/jwt.js";
import { ObjectId } from "mongodb";

// describe("User Class Integration Tests", () => {
//   let collection;

//   beforeAll(async () => {
//     // Connect to the real MongoDB database
//     const db = getDB();
//     collection = db.collection("Users");

//     // Clear the Users collection before running tests
//     await collection.deleteMany({});
//   });

//   afterAll(async () => {
//     // Clear the Users collection after all tests are done
//     await collection.deleteMany({});
//   });

//   describe("register", () => {
//     it("should register a new user successfully", async () => {
//       const payload = {
//         fullName: "Test User",
//         email: "test@example.com",
//         password: "password123",
//       };

//       const result = await User.register(payload);

//       expect(result).toBe("Register successful");

//       // Verify the user was inserted into the database
//       const user = await collection.findOne({ email: payload.email });
//       expect(user).toBeDefined();
//       expect(user.fullName).toBe(payload.fullName);
//       expect(user.email).toBe(payload.email);
//       expect(user.freeTrial).toBe(3);
//       expect(comparePasssword(payload.password, user.password)).toBe(true);
//     });

//     it("should throw an error if email is already registered", async () => {
//       const payload = {
//         fullName: "Test User",
//         email: "test@example.com",
//         password: "password123",
//       };

//       // Attempt to register the same user again
//       await expect(registerUser("existing@example.com")).rejects.toMatchObject({
//         message: "Email already registered",
//       });
//     });
//   });

//   //   describe("login", () => {
//   //     it("should login a user successfully with valid credentials", async () => {
//   //       const payload = {
//   //         email: "test@example.com",
//   //         password: "password123",
//   //       };

//   //       const result = await User.login(payload);

//   //       expect(result).toHaveProperty("access_token");
//   //       expect(result).toHaveProperty("userId");

//   //       // Verify the token is valid
//   //       const user = await collection.findOne({ email: payload.email });
//   //       expect(result.userId).toBe(user._id.toString());
//   //     });

//   //     it("should throw an error if email is invalid", async () => {
//   //       const payload = {
//   //         email: "invalid@example.com",
//   //         password: "password123",
//   //       };

//   //       await expect(User.login(payload)).rejects.toThrow(
//   //         "Invalid email or password"
//   //       );
//   //     });

//   //     it("should throw an error if password is invalid", async () => {
//   //       const payload = {
//   //         email: "test@example.com",
//   //         password: "wrongpassword",
//   //       };

//   //       await expect(User.login(payload)).rejects.toThrow(
//   //         "Invalid email or password"
//   //       );
//   //     });
//   //   });

//   //   describe("getUserById", () => {
//   //     it("should return a user by ID", async () => {
//   //       const user = await collection.findOne({ email: "test@example.com" });
//   //       const result = await User.getUserById(user._id);

//   //       expect(result).toBeDefined();
//   //       expect(result._id.toString()).toBe(user._id.toString());
//   //       expect(result.email).toBe(user.email);
//   //     });

//   //     it("should throw an error if user is not found", async () => {
//   //       const invalidId = new ObjectId().toString();
//   //       await expect(User.getUserById(invalidId)).rejects.toThrow(
//   //         "User not found"
//   //       );
//   //     });
//   //   });

//   //   describe("deductFreeTrial", () => {
//   //     it("should deduct free trial count by 1", async () => {
//   //       const user = await collection.findOne({ email: "test@example.com" });
//   //       const newFreeTrial = await User.deductFreeTrial(user._id);

//   //       expect(newFreeTrial).toBe(user.freeTrial - 1);

//   //       // Verify the free trial count was updated in the database
//   //       const updatedUser = await collection.findOne({ _id: user._id });
//   //       expect(updatedUser.freeTrial).toBe(newFreeTrial);
//   //     });

//   //     it("should throw an error if free trial is already 0", async () => {
//   //       const user = await collection.findOne({ email: "test@example.com" });
//   //       await collection.updateOne({ _id: user._id }, { $set: { freeTrial: 0 } });

//   //       await expect(User.deductFreeTrial(user._id)).rejects.toThrow(
//   //         "Your free trial is over. Please subscribe to start a new chat."
//   //       );
//   //     });
//   //   });
// });
