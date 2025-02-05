import {
  expect,
  it,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { getDB } from "../config/mongodb"; // Use actual DB configuration
import { Subscription } from "../models/Subscription";
import request from "supertest"; // For making HTTP requests
import { app, startServer } from "../app"; // Import your Express app
import { hashPassword } from "../helpers/bcryptjs";
import { ObjectId } from "mongodb";

let db;
let userCollection;
let subscriptionCollection;
let accessToken;
let userId;
let httpServer;

const userData = {
  fullName: "Test User 1",
  email: "test1@mail.com",
  password: "123456",
};

const price = 10000;
const midtransBaseUrl = "https://app.sandbox.midtrans.com";

describe("Subscription Model Tests", () => {
  beforeAll(async () => {
    // Start Server
    httpServer = await startServer();
    // server = app.listen(4000, () =>
    //   console.log("🚀 Test Server running on port 4000")
    // );

    // ✅ Get actual DB instance
    db = getDB();
    userCollection = db.collection("Users");
    subscriptionCollection = db.collection("Subscriptions");

    // ✅ Clear collections before running tests
    await userCollection.deleteMany({});
    await subscriptionCollection.deleteMany({});

    // ✅ Hash password before inserting the user
    userData.password = await hashPassword(userData.password, 10);
    const result = await userCollection.insertOne(userData);
    userId = result.insertedId.toString(); // 🔹 Store generated user ID

    // ✅ Perform login to get access token
    const loginResponse = await request(app)
      .post("/graphql") // ✅ Must be /graphql
      .send({
        query: `
        mutation Login($login: LoginInput) {
         login(login: $login) {
            access_token
            userId
            }
        }
        `,
        variables: {
          login: {
            email: userData.email,
            password: "123456",
          },
        },
      });
    console.log("🚀 ~ loginResponse ~ loginResponse.body:", loginResponse.body);

    accessToken = loginResponse.body.data?.login?.access_token;

    if (!accessToken) {
      console.error("❌ Login failed. No access token received.");
      throw new Error("Login failed - Access token is undefined");
    }
  });

  // afterAll(async () => {
  //   // ✅ Cleanup: Remove test data
  //   await userCollection.deleteMany({});
  //   await subscriptionCollection.deleteMany({});
  //   if (httpServer) {
  //     await new Promise((resolve) => httpServer.close(resolve));
  //     console.log("🛑 Test Server stopped");
  //   }
  // });

  describe("Sanbox Tests", () => {
    it("sandbox testing", async () => {
      expect(1).toBe(1);
    });
  });

  describe("addSubscription", () => {
    it("should allow a logged-in user to add a subscription", async () => {
      const response = await request(app)
        .post("/graphql")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          query: `
            mutation AddSubscription($payload: SubscriptionInput) {
            addSubscription(payload: $payload)
            }
          `,
          variables: {
            payload: {
              midtransId: "SUB-123",
              price,
            },
          },
        });
      console.log("🚀 ~ it ~ response:", response.body);

      // ✅ Ensure request was successful
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      // response: { data: { addSubscription: 'f95dc5ee-c61d-4e6f-965a-4c41292e6519' } }
      // expect(response.body.data.addSubscription).toBeDefined();
      expect(typeof response.body.data.addSubscription).toBe("string");
      expect(typeof response.body.data.addSubscription).toBe("string");

      //   console.log("Midtrans ID:>>>>", global.midtransId); // Debugging log

      // ✅ Fetch the inserted subscription from the database
      const insertedSubscription = await subscriptionCollection.findOne({
        userId: new ObjectId(userId),
      });

      console.log("🚀 Inserted Subscription:", insertedSubscription); // Debugging log

      // ✅ Validate that the subscription exists and has status "pending"
      expect(insertedSubscription).toBeDefined();
      expect(insertedSubscription.status).toBe("pending");
      expect(insertedSubscription.price).toBe(price);
      const todayDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1); // Moves to the same day next month
      const nextMonthDate = nextMonth.toISOString().split("T")[0]; // Extract YYYY-MM-DD

      expect(insertedSubscription.startDate).toBe(todayDate);
      expect(insertedSubscription.endDate).toBe(nextMonthDate);
    });
  });

  // describe("🔹 **Failing Subscription Scenarios**", () => {
  //   it("❌ Should **fail** if the user is not logged in", async () => {
  //     const response = await request(app)
  //       .post("/graphql")
  //       .send({
  //         query: `
  //           mutation AddSubscription($payload: SubscriptionInput) {
  //             addSubscription(payload: $payload)
  //           }
  //         `,
  //         variables: {
  //           payload: {
  //             midtransId: "SUB-FAKE",
  //             price,
  //           },
  //         },
  //       });

  //     expect(response.status).toBe(401);
  //     expect(response.body.errors).toBeDefined();
  //     expect(response.body.errors[0].message).toBe("You must be logged in");
  //   });

  //   it("❌ Should **fail** if midtransId is missing", async () => {
  //     const response = await request(app)
  //       .post("/graphql")
  //       .set("Authorization", `Bearer ${accessToken}`)
  //       .send({
  //         query: `
  //           mutation AddSubscription($payload: SubscriptionInput) {
  //             addSubscription(payload: $payload)
  //           }
  //         `,
  //         variables: {
  //           payload: {
  //             price,
  //           },
  //         },
  //       });

  //     expect(response.status).toBe(200);
  //     expect(response.body.errors).toBeDefined();
  //     expect(response.body.errors[0].message).toContain(
  //       'Field "midtransId" of required type "String!" was not provided'
  //     );
  //   });

  //   it("❌ Should **fail** if price is missing", async () => {
  //     const response = await request(app)
  //       .post("/graphql")
  //       .set("Authorization", `Bearer ${accessToken}`)
  //       .send({
  //         query: `
  //           mutation AddSubscription($payload: SubscriptionInput) {
  //             addSubscription(payload: $payload)
  //           }
  //         `,
  //         variables: {
  //           payload: {
  //             midtransId: "SUB-FAKE",
  //           },
  //         },
  //       });

  //     expect(response.status).toBe(200);
  //     expect(response.body.errors).toBeDefined();
  //     expect(response.body.errors[0].message).toContain(
  //       'Field "price" of required type "Int!" was not provided'
  //     );
  //   });

  //   it("should fail if user is already subscribed", async () => {
  //     const midtransId = new ObjectId().toHexString();

  //     // ✅ First Subscription
  //     await request(app)
  //       .post("/graphql")
  //       .set("Authorization", `Bearer ${accessToken}`)
  //       .send({
  //         query: `
  //           mutation AddSubscription($payload: SubscriptionInput) {
  //             addSubscription(payload: $payload)
  //           }
  //         `,
  //         variables: {
  //           payload: {
  //             midtransId,
  //             price,
  //           },
  //         },
  //       });

  //     // ✅ Second Subscription Attempt
  //     const response = await request(app)
  //       .post("/graphql")
  //       .set("Authorization", `Bearer ${accessToken}`)
  //       .send({
  //         query: `
  //           mutation AddSubscription($payload: SubscriptionInput) {
  //             addSubscription(payload: $payload)
  //           }
  //         `,
  //         variables: {
  //           payload: {
  //             midtransId,
  //             price,
  //           },
  //         },
  //       });

  //     console.log("🚀 ~ Duplicate Subscription Response:", response.body);
  //     expect(response.status).toBe(200);
  //     expect(response.body.errors).toBeDefined();
  //     expect(response.body.errors[0].message).toBe(
  //       "You are already subscribed"
  //     );
  //   });

  //   // it("❌ Should **fail** if subscription status is `paymentFailed`", async () => {
  //   //   await subscriptionCollection.insertOne({
  //   //     userId: new ObjectId(userId),
  //   //     midtransId: "SUB-FAILED-PAYMENT",
  //   //     price,
  //   //     startDate: new Date().toISOString().split("T")[0],
  //   //     endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  //   //       .toISOString()
  //   //       .split("T")[0],
  //   //     status: "paymentFailed",
  //   //   });

  //   //   const response = await request(app)
  //   //     .post("/graphql")
  //   //     .set("Authorization", `Bearer ${accessToken}`)
  //   //     .send({
  //   //       query: `
  //   //         mutation AddSubscription($payload: SubscriptionInput) {
  //   //           addSubscription(payload: $payload)
  //   //         }
  //   //       `,
  //   //       variables: {
  //   //         payload: {
  //   //           midtransId: "SUB-NEW-AFTER-FAILED",
  //   //           price,
  //   //         },
  //   //       },
  //   //     });

  //   //   expect(response.status).toBe(200);
  //   //   expect(response.body.errors).toBeDefined();
  //   //   expect(response.body.errors[0].message).toBe(
  //   //     "You are already subscribed"
  //   //   );
  //   // });

  //   // it("❌ Should **fail** if price is negative", async () => {
  //   //   const response = await request(app)
  //   //     .post("/graphql")
  //   //     .set("Authorization", `Bearer ${accessToken}`)
  //   //     .send({
  //   //       query: `
  //   //         mutation AddSubscription($payload: SubscriptionInput) {
  //   //           addSubscription(payload: $payload)
  //   //         }
  //   //       `,
  //   //       variables: {
  //   //         payload: {
  //   //           midtransId: "SUB-NEGATIVE",
  //   //           price: -1000,
  //   //         },
  //   //       },
  //   //     });

  //   //   expect(response.status).toBe(200);
  //   //   expect(response.body.errors).toBeDefined();
  //   //   expect(response.body.errors[0].message).toBe(
  //   //     "Price must be a positive integer"
  //   //   );
  //   // });

  //   // it("❌ Should **fail** if midtransId is too long", async () => {
  //   //   const longMidtransId = "SUB-".padEnd(100, "X");

  //   //   const response = await request(app)
  //   //     .post("/graphql")
  //   //     .set("Authorization", `Bearer ${accessToken}`)
  //   //     .send({
  //   //       query: `
  //   //         mutation AddSubscription($payload: SubscriptionInput) {
  //   //           addSubscription(payload: $payload)
  //   //         }
  //   //       `,
  //   //       variables: {
  //   //         payload: {
  //   //           midtransId: longMidtransId,
  //   //           price,
  //   //         },
  //   //       },
  //   //     });

  //   //   expect(response.status).toBe(200);
  //   //   expect(response.body.errors).toBeDefined();
  //   //   expect(response.body.errors[0].message).toContain("midtransId too long");
  //   // });
  // });
});
