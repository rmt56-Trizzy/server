import { errorHandler } from "../helpers/errorHandler.js";
import { Subscription } from "../models/Subscription.js";

const subscriptionTypeDefs = `#graphql
    type Subscription {
            _id: ID
            userId: ID!
            midtransId: String!
            price: Int!
            startDate: String!
            endDate: String!
            transactionTime: String!
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
    addSubscription: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        console.log(args);
        const { payload } = args;
        payload.userId = userId;
        const response = await Subscription.addSubscription(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ addSubscription: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { subscriptionTypeDefs, subscriptionResolvers };
