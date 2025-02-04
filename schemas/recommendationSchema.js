import { errorHandler } from "../helpers/errorHandler.js";
import { Recommendation } from "../models/Recommendation.js";

const recommendationTypeDefs = `#graphql
    type GeneralRecommendation {
        _id: ID
        city: String
        country: String
        countryCode: String
        cityImage: String
        daysCount: Int
        itineraries: [Itinerary]
    }
    type Recommendation {
        _id: ID
        city: String
        country: String
        countryCode: String
        cityImage: String
        daysCount: Int
        itineraries: [Itinerary]
        chatId: ID
        userId: ID
        viewAccess: String
    }
    type Itinerary {
        day: String
        locations: [Location]
    }
    type Location{
        slug: String
        name: String
        image: String
        category: String
        coordinates: [Float]
    }
    input EditInput {
        recommendationId: ID!
        newItineraries: String
    }
    input CheckViewAccessInput {
        recommendationId: ID!
        viewAccess: String
    }
    input ShareInput {
        recommendationId: ID!
        email: String
    }
    type Query {
        getGeneralRecommendations: [GeneralRecommendation]
        getGeneralRecommendationDetails(_id: ID!): GeneralRecommendation
        getRecommendations(chatId: ID!): [Recommendation]
        getRecommendationDetails(_id: ID!): Recommendation
        getMyTrips: [Recommendation]
        checkViewAccess(payload: CheckViewAccessInput): Recommendation
    }
    type Mutation {
        addGeneralRecommendationToMyTrip(generalRecommendationId: ID!): String
        generateRecommendations(chatId: ID!): [Recommendation]
        generateRecommendationDetails(recommendationId: ID!): Recommendation
        addRecommendationToMyTrip(recommendationId: ID!): String
        editItinerary(payload: EditInput): String
        generateViewAccess(recommendationId: ID!): String
        shareItinerary(payload: ShareInput): String
    }
`;

const recommendationResolvers = {
  Query: {
    getGeneralRecommendations: async () => {
      try {
        const response = await Recommendation.getGeneralRecommendations();
        return response;
      } catch (error) {
        console.log("🚀 ~ getGeneralRecommendations: ~ error:", error);
        errorHandler(error);
      }
    },
    getGeneralRecommendationDetails: async (_, args) => {
      try {
        const { _id } = args;
        const response = await Recommendation.getGeneralRecommendationDetails(
          _id
        );
        return response;
      } catch (error) {
        console.log("🚀 ~ getGeneralRecommendationDetails: ~ error:", error);
        errorHandler(error);
      }
    },
    getRecommendations: async (_, args) => {
      try {
        const { chatId } = args;
        const response = await Recommendation.getRecommendations(chatId);
        return response;
      } catch (error) {
        console.log("🚀 ~ getRecommendations: ~ error:", error);
        errorHandler(error);
      }
    },
    getRecommendationDetails: async (_, args) => {
      try {
        const { _id } = args;
        const response = await Recommendation.getRecommendationDetails(_id);
        return response;
      } catch (error) {
        console.log("🚀 ~ getRecommendationDetails: ~ error:", error);
        errorHandler(error);
      }
    },
    getMyTrips: async (_, args, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.getMyTrips(userId);
        return response;
      } catch (error) {
        console.log("🚀 ~ getMyTrips: ~ error:", error);
        errorHandler(error);
      }
    },
    checkViewAccess: async (_, args) => {
      try {
        const { payload } = args;
        const response = await Recommendation.checkViewAccess(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ checkViewAccess: ~ error:", error);
        errorHandler(error);
      }
    },
  },
  Mutation: {
    addGeneralRecommendationToMyTrip: async (_, args, context) => {
      try {
        const { generalRecommendationId } = args;
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.addGeneralRecommendationToMyTrip({
          userId,
          generalRecommendationId,
        });
        return response;
      } catch (error) {
        console.log("🚀 ~ addGeneralRecommendationToMyTrip: ~ error:", error);
        errorHandler(error);
      }
    },
    generateRecommendations: async (_, args, context) => {
      try {
        const { chatId } = args;
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.generateRecommendations({
          userId,
          chatId,
        });
        return response;
      } catch (error) {
        console.log("🚀 ~ generateRecommendations: ~ error:", error);
        errorHandler(error);
      }
    },
    generateRecommendationDetails: async (_, args, context) => {
      try {
        const { recommendationId } = args;
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.generateRecommendationDetails({
          userId,
          recommendationId,
        });
        return response;
      } catch (error) {
        console.log("🚀 ~ generateRecommendationDetails: ~ error:", error);
        errorHandler(error);
      }
    },
    addRecommendationToMyTrip: async (_, args, context) => {
      try {
        const { recommendationId } = args;
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.addRecommendationToMyTrip({
          userId,
          recommendationId,
        });
        return response;
      } catch (error) {
        console.log("🚀 ~ addRecommendationToMyTrip: ~ error:", error);
        errorHandler(error);
      }
    },
    editItinerary: async (_, args, context) => {
      try {
        const { payload } = args;
        const { _id: userId } = await context.authentication();
        payload.userId = userId;
        const response = await Recommendation.editItinerary(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ editItinerary: ~ error:", error);
        errorHandler(error);
      }
    },
    generateViewAccess: async (_, args, context) => {
      try {
        const { recommendationId } = args;
        const { _id: userId } = await context.authentication();
        const response = await Recommendation.generateViewAccess(
          recommendationId
        );
        return response;
      } catch (error) {
        console.log("🚀 ~ generateViewAccess: ~ error:", error);
        errorHandler(error);
      }
    },
    shareItinerary: async (_, args, context) => {
      try {
        const { payload } = args;
        const { _id: userId } = await context.authentication();
        payload.userId = userId;
        const response = await Recommendation.shareItinerary(payload);
        return response;
      } catch (error) {
        console.log("🚀 ~ shareItinerary: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { recommendationTypeDefs, recommendationResolvers };
