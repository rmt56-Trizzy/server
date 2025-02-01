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
        const subscription = await Subscription.getSubscription(userId);

        // ✅ Improve getSubscription: Check real-time status from Midtrans if pending.
        // If payment is pending, check Midtrans status
        if (subscription.status === "pending") {
          const statusResponse = await getTransactionStatus(
            subscription.midtransId
          );

          if (statusResponse.transaction_status === "settlement") {
            // Update subscription status to active
            await Subscription.updateSubscriptionStatus(
              subscription.midtransId,
              "active"
            );
            subscription.status = "active";
          } else if (
            statusResponse.transaction_status === "expire" ||
            statusResponse.transaction_status === "cancel"
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
        const subscription = await Subscription.isSubscribed(userId);

        if (!subscription) {
          return null;
        }

        return subscription && subscription.status === "active";
      } catch (error) {
        console.log("🚀 ~ isSubscribed: ~ error:", error);
        errorHandler(error);
      }
    },
  },
  Mutation: {
    addSubscription: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();

        // Generate a unique order_id
        const orderId = `SUB-${userId}-${Date.now()}`;

        const { payload } = args;
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
        };

        const transaction = await createTransaction(transactionDetails);

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

        return transaction.redirect_url; // Return payment URL for client to complete payment
      } catch (error) {
        console.log("🚀 ~ addSubscription: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { subscriptionTypeDefs, subscriptionResolvers };
