import { errorHandler } from "../helpers/errorHandler.js";
import { Subscription } from "../models/Subscription.js";
import {
  createTransaction,
  getTransactionStatus,
} from "../helpers/midtrans.js";

const subscriptionTypeDefs = `#graphql
    type Subscription {
            _id: ID
            userId: ID!
            midtransId: String!
            price: Int!
            startDate: String!
            endDate: String!
            transactionTime: String!
            status: String!
        }
    input SubscriptionInput {
            midtransId: String!
            price: Int!
        }
    type Query {
            getSubscription: Subscription
            isSubscribed: Boolean
        }
    type Mutation {
            addSubscription(payload: SubscriptionInput): String
        }
`;

const subscriptionResolvers = {
  Query: {
    getSubscription: async (_, __, context) => {
      try {
        const { _id: userId } = await context.authentication();
        console.log("🚀 ~ getSubscription: ~ userId:", userId);
        const subscription = await Subscription.getSubscription(userId);
        console.log("🚀 ~ getSubscription: ~ subscription:", subscription);

        if (!subscription) {
          return null; // No subscription found
        }

        // ✅ Improve getSubscription: Check real-time status from Midtrans if pending.
        // If payment is pending, check Midtrans status
        if (subscription.status === "pending") {
          const statusResponse = await getTransactionStatus(
            subscription.midtransId
          );
          console.log(
            "🚀 ~ getSubscription: ~ statusResponse:",
            statusResponse
          );

          if (
            statusResponse.transaction_status === "settlement" ||
            statusResponse.transaction_status === "capture"
          ) {
            // Update subscription status to paid
            await Subscription.updateSubscriptionStatus(
              subscription.midtransId,
              "paid"
            );
            subscription.status = "paid";
          } else if (
            statusResponse.transaction_status === "expire" ||
            statusResponse.transaction_status === "cancel" ||
            statusResponse.transaction_status === "deny" ||
            statusResponse.transaction_status === "failure"
          ) {
            await Subscription.updateSubscriptionStatus(
              subscription.midtransId,
              "paymentFailed"
            );
            subscription.status = "paymentFailed";
          }
        }

        return subscription;
      } catch (error) {
        console.log("🚀 ~ getSubscription: ~ error:", error);
        errorHandler(error);
      }
    },
    isSubscribed: async (_, __, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const response = await Subscription.isSubscribed(userId);
        return response;
      } catch (error) {
        console.log("🚀 ~ isSubscribed: ~ error:", error);
        errorHandler(error);
      }
    },
  },
  Mutation: {
    addSubscription: async (_, { payload }, context) => {
      try {
        const { _id: userId } = await context.authentication();

        // Generate a unique order_id
        const orderId = `SUB-${userId}-${Date.now()}`;

        payload.userId = userId;

        // Generate a Midtrans transaction
        const transactionDetails = {
          transaction_details: {
            order_id: orderId,
            gross_amount: payload.price, // Amount in IDR
          },
          customer_details: {
            user_id: userId,
          },
          // callback dipakai kalau mau redirect ke thank you page
          // callbacks: {
          //   finish:
          //     process.env.NODE_ENV === "production"
          //       ? process.env.VITE_MIDTRANS_CALLBACK_PROD
          //       : process.env.VITE_MIDTRANS_CALLBACK_DEV,
          // },
        };

        let transaction;
        try {
          transaction = await createTransaction(transactionDetails);
        } catch (error) {
          console.error("🚀 ~ Error creating Midtrans transaction:", error);
          throw new Error("Failed to create Midtrans transaction");
        }

        // Store transaction details in your DB
        await Subscription.addSubscription({
          userId,
          midtransId: orderId,
          price: payload.price,
          startDate: new Date().toISOString(),
          endDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // +30 days
          transactionTime: new Date().toISOString(),
          status: "pending", // Initial status before payment confirmation
        });

        console.log(`✅ Subscription initiated: Order ID ${orderId}`);

        // return transaction.redirect_url; // Return payment URL for testing using Postman
        return transaction.token; // Return token for client to complete payment
      } catch (error) {
        console.log("🚀 ~ addSubscription: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { subscriptionTypeDefs, subscriptionResolvers };
