import { getDB } from "../config/mongodb.js";
import {
  expect,
  it,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  jest,
} from "@jest/globals";
import { User } from "../models/User.js";
import { Chat } from "../models/Chat.js";
import { Subscription } from "../models/Subscription.js";
import { Recommendation } from "../models/Recommendation.js";
import { ObjectId } from "mongodb";
import request from "supertest"; // For making HTTP requests
import { app, startServer } from "../app.js"; // Adjust the import based on your project structure
import { uid } from "uid";
import { userTypeDefs, userResolvers } from "../schemas/userSchema.js";
import { chatTypeDefs, chatResolvers } from "../schemas/chatSchema.js";
import {
  subscriptionTypeDefs,
  subscriptionResolvers,
} from "../schemas/subscriptionSchema.js";
import { recommendationResolvers } from "../schemas/recommendationSchema.js";
import { GraphQLError } from "graphql";
import e from "express";

jest.mock("uid");

describe("Recommendation Model Integration Tests", () => {
  let db;
  let chatCollection;
  let userCollection;
  let subscriptionCollection;
  let generalRecommendationCollection;
  let recommendationCollection;
  let httpServer;
  let userId;
  let chatId;
  let recommendationId;
  let viewAccess;
  let access_token;
  let input;
  let response;

  beforeAll(async () => {
    // Connect to the real MongoDB database
    process.env.PORT = 3008;
    httpServer = await startServer();
    db = getDB();
    recommendationCollection = db.collection("Recommendations");
    generalRecommendationCollection = db.collection("GeneralRecommendations");
    chatCollection = db.collection("Chats");
    userCollection = db.collection("Users");
    subscriptionCollection = db.collection("Subscriptions");
    //try register user
    input = {
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    response = await userResolvers.Mutation.register(null, {
      input,
    });

    response = await userResolvers.Mutation.login(null, {
      login: {
        email: input.email,
        password: input.password,
      },
    });
    userId = response.userId;
    access_token = response.access_token;

    // Create a chat
    var payload = {
      userMessage: "Hi, I want to go for holiday",
    };
    var context = {
      authentication: jest.fn().mockResolvedValue({ _id: userId }),
    };
    var result = await chatResolvers.Mutation.createChat(
      null,
      { payload },
      context
    );
    chatId = result._id;
    var payload = {
      chatId: chatId,
      userMessage: "I want to go to europe. for 3 days.",
    };
    var context = {
      authentication: jest.fn().mockResolvedValue({ _id: userId }),
    };
    var result = await chatResolvers.Mutation.saveReplyFromUser(
      null,
      { payload },
      context
    );
  });

  // beforeEach(async () => {
  //   // Clear the collections before each test
  //   await recommendationCollection.deleteMany({});
  //   await chatCollection.deleteMany({});
  // });

  afterAll(async () => {
    // Cleanup: Remove test data
    await recommendationCollection.deleteMany({});
    await chatCollection.deleteMany({});
    await userCollection.deleteMany({});
    await subscriptionCollection.deleteMany({});
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));

      console.log("🛑 Test Server stopped");
    }
  });
  describe("Get General Recommendation", () => {
    it("should return all general recommendation", async () => {
      const result =
        await recommendationResolvers.Query.getGeneralRecommendations();
      expect(result).toHaveLength(5);
    });
  });

  describe("Get Recommendation Details", () => {
    it("should return recommendation details", async () => {
      const result =
        await recommendationResolvers.Query.getGeneralRecommendationDetails(
          null,
          {
            _id: new ObjectId("679f8462d914738fbc1e1515"),
          }
        );
      expect(result).toHaveProperty("_id");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("country");
    });

    it("should throw an error if recommendation is not found", async () => {
      try {
        await recommendationResolvers.Query.getGeneralRecommendationDetails(
          null,
          {
            _id: null,
          }
        );
      } catch (error) {
        expect(error.message).toBe("Id is required");
      }
    });
  });

  describe("Add General Recommendation to my trip", () => {
    it("should add a new general recommendation", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result =
        await recommendationResolvers.Mutation.addGeneralRecommendationToMyTrip(
          null,
          {
            generalRecommendationId: new ObjectId("679f8462d914738fbc1e1515"),
          },
          context
        );
      expect(result).toEqual(expect.any(String));
    });

    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.addGeneralRecommendationToMyTrip(
          null,
          {
            generalRecommendationId: new ObjectId("679f8462d914738fbc1e1515"),
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should throw an error if general recommendation id is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.addGeneralRecommendationToMyTrip(
          null,
          {
            generalRecommendationId: null,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Id is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if general recommendation is not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.addGeneralRecommendationToMyTrip(
          null,
          {
            generalRecommendationId: new ObjectId("679f8462d914738fbc1e1512"),
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("General Recommendation not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
    it("should throw an error if general recommendation is already in my trip", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.addGeneralRecommendationToMyTrip(
          null,
          {
            generalRecommendationId: new ObjectId("679f8462d914738fbc1e1515"),
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe(
          "You have already added this recommendation to your trip"
        );
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Generate Recommendations", () => {
    it("should generate recommendations", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result =
        await recommendationResolvers.Mutation.generateRecommendations(
          null,
          {
            chatId: chatId,
          },
          context
        );
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("chatId");
      expect(result[0]).toHaveProperty("city");
    }, 120000);
    it("should throw an error if chat id is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.generateRecommendations(
          null,
          {
            chatId: null,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if chat id is not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.generateRecommendations(
          null,
          {
            chatId: new ObjectId("679f8462d914738fbc1e1512"),
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.generateRecommendations(
          null,
          {
            chatId: chatId,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should throw an error if recommendation exists", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };

      const result =
        await recommendationResolvers.Mutation.generateRecommendations(
          null,
          {
            chatId: chatId,
          },
          context
        );
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("chatId");
      expect(result[0]).toHaveProperty("city");
      expect(result[0]).toHaveProperty("country");
    });
  });

  describe("Get Recommendations", () => {
    it("should get recommendations", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Query.getRecommendations(
        null,
        {
          chatId: chatId,
        },
        context
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty("chatId");
      expect(result[0]).toHaveProperty("city");
      expect(result[0]).toHaveProperty("country");
      recommendationId = result[0]._id;
    });

    it("should throw an error if chat id is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Query.getRecommendations(
          null,
          {
            chatId: null,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Generate Recommendation Details", () => {
    it("should generate recommendation details", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result =
        await recommendationResolvers.Mutation.generateRecommendationDetails(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      expect(result).toHaveProperty("chatId");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("country");
      expect(result).toHaveProperty("itineraries");
      expect(result).toHaveProperty("daysCount");
    }, 12000);
    it("should throw an error if recommendation id is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.generateRecommendationDetails(
          null,
          {
            recommendationId: null,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Recommendation ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if recommendation details has been generated", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result =
        await recommendationResolvers.Mutation.generateRecommendationDetails(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      expect(result).toHaveProperty("chatId");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("country");
      expect(result).toHaveProperty("itineraries");
      expect(result).toHaveProperty("daysCount");
    });
    it("should throw an error if chat not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      await recommendationCollection.updateOne(
        {
          _id: new ObjectId(recommendationId),
        },
        {
          $set: {
            chatId: new ObjectId("679f8462d914738fbc1e1515"),
          },
        }
      );
      try {
        await recommendationResolvers.Mutation.generateRecommendationDetails(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Chat not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Get Recommendation Details", () => {
    it("should get recommendation details", async () => {
      const result =
        await recommendationResolvers.Query.getRecommendationDetails(null, {
          _id: recommendationId,
        });
      expect(result).toHaveProperty("_id");
      expect(result).toHaveProperty("city");
      expect(result).toHaveProperty("country");
    });
    it("should throw an error if recommendation id is missing", async () => {
      try {
        await recommendationResolvers.Query.getRecommendationDetails(null, {
          _id: null,
        });
      } catch (error) {
        expect(error.message).toBe("Recommendation ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if recommendation not found", async () => {
      try {
        await recommendationResolvers.Query.getRecommendationDetails(null, {
          _id: new ObjectId("679f8462d914738fbc1e1515"),
        });
      } catch (error) {
        expect(error.message).toBe("Recommendation not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Add recommendation to my trip", () => {
    it("should add recommendations to my trip", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result =
        await recommendationResolvers.Mutation.addRecommendationToMyTrip(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      expect(result).toEqual(expect.any(String));
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.addRecommendationToMyTrip(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });

    it("should throw an error if recommendation id are missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.addRecommendationToMyTrip(
          null,
          {
            recommendationId: null,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Recommendation ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if recommendation is alread in my trip", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.addRecommendationToMyTrip(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe(
          "You have already added this recommendation to your trip"
        );
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("Edit Itinerary", () => {
    it("should edit itinerary", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Mutation.editItinerary(
        null,
        {
          payload: {
            recommendationId: recommendationId,
            newItineraries: JSON.stringify([
              {
                day: "Day 1",
                locations: [
                  {
                    slug: "ubud-palace 2",
                    name: "Ubud Palace 2",
                    image:
                      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Ubud_Palace_%282022%29.jpg",
                    category: "Architectural Buildings",
                    coordinates: [-8.5065977, 115.2625884],
                  },
                ],
              },
            ]),
          },
        },
        context
      );
      expect(result).toEqual(expect.any(String));
    });

    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.editItinerary(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              newItineraries: JSON.stringify([]),
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should throw an error if recommendation id are missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.editItinerary(
          null,
          {
            payload: {
              recommendationId: null,
              newItineraries: JSON.stringify([]),
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Itinerary ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if itinerary is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.editItinerary(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              newItineraries: null,
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("New itineraries are required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if itinerary id is not valid", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.editItinerary(
          null,
          {
            payload: {
              recommendationId: new ObjectId("67a3dc93cae73c38d6cafd73"),
              newItineraries: JSON.stringify([]),
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Itinerary not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Get My Trips", () => {
    it("should get my trips", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Query.getMyTrips(
        null,
        null,
        context
      );
      expect(result).toEqual(expect.any(Array));
      expect(result[0]).toEqual(expect.any(Object));
      expect(result[0]).toHaveProperty("_id");
      expect(result[0]).toHaveProperty("city");
      expect(result[0]).toHaveProperty("userId");
      expect(result[0]).toHaveProperty("itineraries");
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Query.getMyTrips(null, null, context);
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("Generate View Access", () => {
    it("should generate view access", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Mutation.generateViewAccess(
        null,
        {
          recommendationId: recommendationId,
        },
        context
      );
      expect(result).toEqual(expect.any(String));
      viewAccess = result;
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.generateViewAccess(
          null,
          {
            recommendationId: recommendationId,
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should throw an error if recommendation is not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.generateViewAccess(
          null,
          {
            recommendationId: new ObjectId("67a3dc93cae73c38d6cafd73"),
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Recommendation not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("Check view access", () => {
    it("should check view access", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Query.checkViewAccess(
        null,
        {
          payload: {
            recommendationId: recommendationId,
            viewAccess: viewAccess,
          },
        },
        context
      );
      expect(result).toEqual(true);
    });
    it("should throw an error if recommendation is not found", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Query.checkViewAccess(
          null,
          {
            payload: {
              recommendationId: new ObjectId("67a3dc93cae73c38d6cafd73"),
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Recommendation not found");
        expect(error.extensions.code).toBe("NOT_FOUND");
      }
    });
    it("should throw an error if view access is not valid", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Query.checkViewAccess(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              viewAccess: "",
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("View access is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Query.checkViewAccess(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              viewAccess: viewAccess,
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should return false if viewAccess does not match", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };

      const result = await recommendationResolvers.Query.checkViewAccess(
        null,
        {
          payload: {
            recommendationId: recommendationId,
            viewAccess: "kjsjdhasd892389e",
          },
        },
        context
      );
      expect(result).toEqual(false);
    });
  });

  describe("Share itinerary", () => {
    it("should share itinerary", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      const result = await recommendationResolvers.Mutation.shareItinerary(
        null,
        {
          payload: {
            recommendationId: recommendationId,
            email: "test@example.com",
          },
        },
        context
      );
      console.log(result);
      expect(result).toEqual(expect.any(String));
    });
    it("should throw an error if user is not logged in", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: null }),
      };
      try {
        await recommendationResolvers.Mutation.shareItinerary(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              email: "test@example.com",
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("You must be logged in");
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
    it("should throw an error if recommendation id is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.shareItinerary(
          null,
          {
            payload: {
              recommendationId: null,
              email: "test@example.com",
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Recommendation ID is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if email is missing", async () => {
      const context = {
        authentication: jest.fn().mockResolvedValue({ _id: userId }),
      };
      try {
        await recommendationResolvers.Mutation.shareItinerary(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              email: "",
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe("Email is required");
        expect(error.extensions.code).toBe("BAD_REQUEST");
      }
    });
    it("should throw an error if recommendation userId is not matched", async () => {
      const context = {
        authentication: jest
          .fn()
          .mockResolvedValue({ _id: new ObjectId("67a2e47057623c8b4a1954d7") }),
      };
      try {
        await recommendationResolvers.Mutation.shareItinerary(
          null,
          {
            payload: {
              recommendationId: recommendationId,
              email: "test@example.com",
            },
          },
          context
        );
      } catch (error) {
        expect(error.message).toBe(
          "You are not authorized to share this itinerary"
        );
        expect(error.extensions.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
