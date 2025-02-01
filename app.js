import "dotenv/config";
import { ApolloServer } from "@apollo/server";
// Apollo Standalone Server does not allow integrating Express routes, you need to switch to Apollo Server with Express.
// import { startStandaloneServer } from "@apollo/server/standalone";
import { userResolvers, userTypeDefs } from "./schemas/userSchema.js";
import {
  subscriptionTypeDefs,
  subscriptionResolvers,
} from "./schemas/subscriptionSchema.js";
import { chatTypeDefs, chatResolvers } from "./schemas/chatSchema.js";
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
    const { order_id, transaction_status } = req.body;

    // Verify transaction status with Midtrans API
    const statusResponse = await getTransactionStatus(order_id);

    // https://docs.midtrans.com/docs/https-notification-webhooks#b-status-definition-b
    if (
      transaction_status === "settlement" ||
      transaction_status === "capture"
    ) {
      await Subscription.updateSubscriptionStatus(order_id, "active");
      console.log(`✅ Payment successful: Order ID ${order_id}`);
    } else if (
      transaction_status === "expire" ||
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "failure"
    ) {
      await Subscription.updateSubscriptionStatus(order_id, "paymentFailed");
      console.log(`❌ Payment failed: Order ID ${order_id}`);
    }

    res.status(200).json({ message: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Error processing webhook" });
  }
});

const server = new ApolloServer({
  typeDefs: [userTypeDefs, subscriptionTypeDefs, chatTypeDefs],
  resolvers: [userResolvers, subscriptionResolvers, chatResolvers],
  introspection: true,
});

// const { url } = await startStandaloneServer(server, {
//   listen: { port: process.env.PORT || 3005 },
//   context: async ({ req, res }) => {
//     const authN = async () => {
//       const bearerToken = req.headers.authorization;
//       if (!bearerToken) {
//         throw new Error(
//           JSON.stringify({
//             message: "You must be logged in",
//             code: "UNAUTHORIZED",
//           })
//         );
//       }
//       const [type, token] = bearerToken.split(" ");

//       const { userId } = verifyToken(token);
//       if (!userId) {
//         throw new Error(
//           JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
//         );
//       }
//       const user = await User.getUserById(userId);
//       if (!user) {
//         throw new Error(
//           JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
//         );
//       }
//       const { password, ...rest } = user;
//       return rest;
//     };

//     return {
//       authentication: () => authN(),
//     };
//   },
// });

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
            throw new Error(
              JSON.stringify({
                message: "You must be logged in",
                code: "UNAUTHORIZED",
              })
            );
          }
          const [type, token] = bearerToken.split(" ");

          const { userId } = verifyToken(token);
          if (!userId) {
            throw new Error(
              JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
            );
          }
          const user = await User.getUserById(userId);
          if (!user) {
            throw new Error(
              JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
            );
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
startServer();
