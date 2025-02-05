import "dotenv/config";
import crypto from "crypto";
import { ApolloServer } from "@apollo/server";
// Apollo Standalone Server does not allow integrating Express routes, you need to switch to Apollo Server with Express.
// import { startStandaloneServer } from "@apollo/server/standalone";
import { userResolvers, userTypeDefs } from "./schemas/userSchema.js";
import {
  subscriptionTypeDefs,
  subscriptionResolvers,
} from "./schemas/subscriptionSchema.js";
import { chatTypeDefs, chatResolvers } from "./schemas/chatSchema.js";
import {
  recommendationTypeDefs,
  recommendationResolvers,
} from "./schemas/recommendationSchema.js";
import { verifyToken } from "./helpers/jwt.js";
import { User } from "./models/User.js";
import { Subscription } from "./models/Subscription.js";
import express from "express";
import http from "http";
import { getTransactionStatus } from "./helpers/midtrans.js";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());

// Midtrans Webhook Route (Before Apollo Middleware)
app.post("/midtrans-webhook", async (req, res) => {
  try {
    const {
      transaction_status,
      fraudStatus,
      signature_key,
      status_code,
      order_id,
      gross_amount,
    } = req.body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // Sha512 signature_key = SHA512(order_id + status_code + gross_amount + server_key)
    const mySignatureKey = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount.toString() + serverKey)
      .digest("hex");

    console.log("🚀 ~ app.post ~ mySignatureKey:", mySignatureKey);
    console.log("🚀 ~ app.post ~ signature_key:", signature_key);

    if (mySignatureKey !== signature_key) {
      return res.status(403).json({ message: "Invalid signature" });
    }

    console.log("🚀 ~ app.post ~ mySignatureKey === signature_key:");

    // https://docs.midtrans.com/docs/https-notification-webhooks#b-status-definition-b
    // https://docs.midtrans.com/docs/https-notification-webhooks#b-verifying-notification-authenticity-b
    if (transaction_status === "capture") {
      if (fraudStatus == "accept") {
        await Subscription.updateSubscriptionStatus(order_id, "paid");
        console.log(`✅ Payment successful: Order ID ${order_id}`);
        return res
          .status(200)
          .json({ message: "Payment captured successfully" });
      }
    } else if (transaction_status === "settlement") {
      await Subscription.updateSubscriptionStatus(order_id, "paid");
      console.log(`✅ Payment successful: Order ID ${order_id}`);
      return res.status(200).json({ message: "Payment settled successfully" });
    } else if (
      ["expire", "cancel", "deny", "failure"].includes(transaction_status)
    ) {
      await Subscription.updateSubscriptionStatus(order_id, "paymentFailed");
      console.log(`❌ Payment failed: Order ID ${order_id}`);
      return res.status(200).json({ message: "Payment failed" });
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Error processing webhook" });
  }
});

const server = new ApolloServer({
  typeDefs: [
    userTypeDefs,
    subscriptionTypeDefs,
    chatTypeDefs,
    recommendationTypeDefs,
  ],
  resolvers: [
    userResolvers,
    subscriptionResolvers,
    chatResolvers,
    recommendationResolvers,
  ],
  introspection: true,
});

// 🛠 Apply Apollo Middleware to Express
async function startServer() {
  await server.start(); // ✅ Ensure Apollo is started before applying middleware
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authN = async () => {
          const bearerToken = req.headers.authorization;
          if (!bearerToken) {
            throw {
              message: "You must be logged in",
              code: "UNAUTHORIZED",
            };
          }
          const [type, token] = bearerToken.split(" ");

          const { userId } = verifyToken(token);
          if (!userId) {
            throw { message: "Invalid token", code: "UNAUTHORIZED" };
          }
          const user = await User.getUserById(userId);
          if (!user) {
            throw { message: "Invalid token", code: "UNAUTHORIZED" };
          }
          const { password, ...rest } = user;
          return rest;
        };

        return { authentication: () => authN() };
      },
    })
  );

  const PORT = process.env.PORT || 3005;
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at: http://localhost:${PORT}/graphql`);
    console.log(
      `📡 Webhook running at: http://localhost:${PORT}/midtrans-webhook`
    );
  });
}

// ✅ Start the server
// if (process.env.NODE_ENV !== "test") {
//   const PORT = process.env.PORT || 3005;
//   httpServer.listen(PORT, () => {
//     console.log(`🚀 GraphQL Server ready at: http://localhost:${PORT}/graphql`);
//     console.log(
//       `📡 Webhook running at: http://localhost:${PORT}/midtrans-webhook`
//     );
//   });
// }

if (process.env.NODE_ENV !== "test" && !httpServer.listening) {
  const PORT = process.env.PORT || 3005;
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL Server ready at: http://localhost:${PORT}/graphql`);
    console.log(
      `📡 Webhook running at: http://localhost:${PORT}/midtrans-webhook`
    );
  });
}

// When running tests with Jest/Supertest, we manually start the server inside our test file (beforeAll hook).
if (process.env.NODE_ENV !== "test") {
  startServer();
}

// ✅ Export `app` & `startServer`
export { app, startServer };
