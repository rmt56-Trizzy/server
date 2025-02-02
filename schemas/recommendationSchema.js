import { errorHandler } from "../helpers/errorHandler.js";
import { Recommendation } from "../models/Recommendation.js";

const recommendationTypeDefs = `#graphql
    type GeneralRecommendation {
        _id: ID
        city: String!
        country: String!
        countryCode: String
        cityImage: String
        itineraries: [Itinerary]
    }
    type Recommendation {
        _id: ID
        city: String!
        country: String!
        countryCode: String
        cityImage: String
        itineraries: [Itinerary]
        chatId: ID
        userId: ID
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
    type Query {
        getGeneralRecommendations: [GeneralRecommendation]
        getGeneralRecommendationDetails(_id: ID!): GeneralRecommendation
    }
    type Mutation {
        getRecommendations: [Recommendation]
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
  },
  Mutation: {},
};

export { recommendationTypeDefs, recommendationResolvers };
