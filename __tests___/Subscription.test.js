// import { ObjectId } from "mongodb";
// import { expect, it, describe } from "@jest/globals";
// import { Subscription } from "../models/Subscription.js";
// import { jest } from "@jest/globals";
// import mockdate from "mockdate";

// // Create mock collection first
// const mockCollection = {
//   insertOne: jest.fn(),
//   findOne: jest.fn(),
//   updateOne: jest.fn(),
// };

// // Mock the mongodb config module with guaranteed collection return
// jest.mock("../config/mongodb.js", () => ({
//   getDB: jest.fn().mockReturnValue({
//     collection: jest.fn().mockReturnValue(mockCollection),
//   }),
// }));

// beforeEach(() => {
//   // Reset all mocks before each test
//   jest.clearAllMocks();
//   mockdate.reset();

//   // Ensure collection mock is fresh
//   mockCollection.insertOne.mockReset();
//   mockCollection.findOne.mockReset();
//   mockCollection.updateOne.mockReset();
// });
// describe("Subscription Class", () => {
//   describe("addSubscription", () => {
//     it("should throw an error if userId is missing", async () => {
//       const payload = { midtransId: "123", price: 100 };
//       await expect(Subscription.addSubscription(payload)).rejects.toThrow(
//         "You must be logged in"
//       );
//     });

//     it("should throw an error if midtransId is missing", async () => {
//       const payload = { userId: new ObjectId().toString(), price: 100 };
//       await expect(Subscription.addSubscription(payload)).rejects.toThrow(
//         "Transaction Failed"
//       );
//     });

//     it("should add a subscription if payload is valid", async () => {
//       const payload = {
//         userId: new ObjectId().toString(),
//         midtransId: "123",
//         price: 100,
//       };

//       mockCollection.findOne.mockResolvedValue(null); // ✅ No existing subscription

//       const result = await Subscription.addSubscription(payload);

//       expect(result).toBe("Subscription added successfully");
//       expect(mockCollection.insertOne).toHaveBeenCalledWith(
//         expect.objectContaining({
//           userId: payload.userId,
//           midtransId: payload.midtransId,
//           price: payload.price,
//           status: "pending",
//         })
//       );
//     });

//     it("should throw an error if user is already subscribed", async () => {
//       const payload = {
//         userId: new ObjectId().toString(),
//         midtransId: "123",
//         price: 100,
//       };

//       mockCollection.findOne.mockResolvedValue({ status: "paid" }); // ✅ Existing subscription

//       await expect(Subscription.addSubscription(payload)).rejects.toThrow(
//         "You are already subscribed"
//       );
//     });
//   });

//   describe("getSubscription", () => {
//     it("should throw an error if userId is missing", async () => {
//       await expect(Subscription.getSubscription()).rejects.toThrow(
//         "You must be logged in"
//       );
//     });

//     it("should return the latest subscription for a user", async () => {
//       const userId = new ObjectId().toString();
//       const mockSubscription = {
//         userId: new ObjectId(userId),
//         midtransId: "123",
//         price: 100,
//         status: "paid",
//       };

//       mockCollection.findOne.mockResolvedValue(mockSubscription);

//       const result = await Subscription.getSubscription(userId);
//       expect(result).toEqual(mockSubscription);
//       expect(mockCollection.findOne).toHaveBeenCalledWith(
//         { userId: new ObjectId(userId) },
//         { sort: { transactionTime: -1 } }
//       );
//     });
//   });

//   describe("isSubscribed", () => {
//     it("should return false if no subscription exists", async () => {
//       const userId = new ObjectId().toString();
//       mockCollection.findOne.mockResolvedValue(null);

//       const result = await Subscription.isSubscribed(userId);
//       expect(result).toBe(false);
//     });

//     it("should return true if subscription is active", async () => {
//       const userId = new ObjectId().toString();
//       const mockSubscription = {
//         userId: new ObjectId(userId),
//         midtransId: "123",
//         price: 100,
//         status: "paid",
//         startDate: new Date().toISOString().split("T")[0],
//         endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
//           .toISOString()
//           .split("T")[0],
//       };

//       mockCollection.findOne.mockResolvedValue(mockSubscription);

//       const result = await Subscription.isSubscribed(userId);
//       expect(result).toBe(true);
//     });

//     it("should return false if subscription is expired", async () => {
//       const userId = new ObjectId().toString();
//       const mockSubscription = {
//         userId: new ObjectId(userId),
//         midtransId: "123",
//         price: 100,
//         status: "paid",
//         startDate: "2023-01-01",
//         endDate: "2023-02-01",
//       };

//       // Mock the current date to be after the subscription end date
//       mockdate.set("2023-03-01");

//       mockCollection.findOne.mockResolvedValue(mockSubscription);

//       const result = await Subscription.isSubscribed(userId);
//       expect(result).toBe(false);
//     });
//   });

//   describe("updateSubscriptionStatus", () => {
//     it("should update the subscription status", async () => {
//       const midtransId = "123";
//       const newStatus = "paid";

//       await Subscription.updateSubscriptionStatus(midtransId, newStatus);

//       expect(mockCollection.updateOne).toHaveBeenCalledWith(
//         { midtransId },
//         { $set: { status: newStatus } }
//       );
//     });
//   });
// });
