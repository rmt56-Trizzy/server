import { getDB } from "../config/mongodb.js";
import { Chat } from "./Chat.js";
import { User } from "./User.js";
import { ObjectId } from "mongodb";
import { getImages, getCityImages } from "../helpers/scrapeImage.js";
import { scrapeCoordinate } from "../helpers/scrapeCoordinate.js";
import { uid } from "uid";
import {
  pplxRequestCities,
  pplxRequestItineraries,
} from "../helpers/pplxai.js";
import { sendMail } from "../helpers/mailer.js";
import { config } from "dotenv";

export class Recommendation {
  static getGeneralCollection() {
    const db = getDB();
    const collection = db.collection("GeneralRecommendations");
    return collection;
  }

  static async getGeneralRecommendations() {
    const collection = this.getGeneralCollection();
    const response = await collection.find({}).toArray();
    return response;
  }

  static async getGeneralRecommendationDetails(id) {
    const collection = this.getGeneralCollection();
    const response = await collection.findOne({ _id: new ObjectId(id) });
    return response;
  }

  static getCollection() {
    const db = getDB();
    const collection = db.collection("Recommendations");
    return collection;
  }

  static async addGeneralRecommendationToMyTrip(payload) {
    const { userId, generalRecommendationId } = payload;
    const generalRecommendationDetails =
      await this.getGeneralRecommendationDetails(generalRecommendationId);
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!generalRecommendationId) {
      throw {
        message: "General Recommendation ID is required",
        code: "BAD_REQUEST",
      };
    }
    if (!generalRecommendationDetails) {
      throw {
        message: "General Recommendation not found",
        code: "NOT_FOUND",
      };
    }
    const recommendation = await collection.findOne({
      userId: new ObjectId(userId),
      chatId: new ObjectId(generalRecommendationId),
    });
    if (recommendation) {
      throw {
        message: "You have already added this recommendation to your trip",
        code: "BAD_REQUEST",
      };
    }
    console.log(generalRecommendationDetails);
    const newRecommendation = {
      userId: new ObjectId(userId),
      chatId: new ObjectId(generalRecommendationId),
      city: generalRecommendationDetails.city,
      country: generalRecommendationDetails.country,
      countryCode: generalRecommendationDetails.countryCode,
      cityImage: generalRecommendationDetails.cityImage,
      daysCount: generalRecommendationDetails.daysCount,
      itineraries: generalRecommendationDetails.itineraries,
    };
    const response = await collection.insertOne(newRecommendation);
    //get the id of the new recommendation
    console.log(response);
    const recommendationId = response.insertedId;
    return `${recommendationId}`;
  }

  static async generateRecommendations(payload) {
    const collection = this.getCollection();
    const { userId, chatId } = payload;
    const chat = await Chat.getChatById(chatId, userId);
    if (!chat) {
      throw {
        message: "Chat not found",
        code: "NOT_FOUND",
      };
    }
    const existingRecommendation = await this.getRecommendations(chatId);
    if (existingRecommendation.length > 0) {
      console.log("Recommendations already exist");
      return existingRecommendation;
    }
    const userChat = chat.messages
      .filter((message) => message.sender === "User")
      .map((message) => message.message)
      .join(". ");
    // console.log(userChat);
    // const response = await pplxRequestCities(userChat);
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        response = await pplxRequestCities(userChat);
        break;
      } catch (error) {
        console.log(`Attempt ${retries + 1} failed:`, error);
        retries++;
        if (retries === maxRetries) {
          throw new Error("Failed to get response after maximum retries");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
      }
    }
    // const cities = response.match(/{.*?}/g).map((city) => JSON.parse(city));
    const trimmedResponse = response.match(/```json\n(.*?)```/s)[1];
    const cities = JSON.parse(trimmedResponse);
    //get images for each city
    const citiesWithImages = await getCityImages(cities);
    // insert into Recommendations collection
    const newRecommendations = citiesWithImages.map((city) => {
      return {
        chatId: new ObjectId(chatId),
        city: city.city,
        country: city.country,
        countryCode: city.countryCode,
        cityImage: city.cityImage,
        itineraries: [],
      };
    });
    await collection.insertMany(newRecommendations);
    return newRecommendations;
  }

  static async getRecommendations(chatId) {
    const collection = this.getCollection();
    const response = await collection
      .find({ chatId: new ObjectId(chatId) })
      .toArray();
    return response;
  }

  static async generateRecommendationDetails(payload) {
    const collection = this.getCollection();
    const { recommendationId, userId } = payload;
    if (!recommendationId) {
      throw {
        message: "Recommendation ID is required",
        code: "BAD_REQUEST",
      };
    }
    const recommendation = await collection.findOne({
      _id: new ObjectId(recommendationId),
    });
    if (recommendation?.itineraries?.length > 0) {
      console.log("Recommendation details already exist");
      return recommendation;
    }
    const chatId = recommendation.chatId;
    const chat = await Chat.getChatById(chatId, userId);
    if (!chat) {
      throw {
        message: "Chat not found",
        code: "NOT_FOUND",
      };
    }
    const userChat = chat.messages
      .filter((message) => message.sender === "User")
      .map((message) => message.message)
      .join(". ");
    console.log(userChat);
    const city = recommendation.city;
    const country = recommendation.country;
    // const response = await pplxRequestItineraries(
    //   `${userChat}. Please create the detail itineraries for ${city},${country}.`
    // );
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        response = await pplxRequestItineraries(
          `${userChat}. Please create the detail itineraries for ${city},${country}.`
        );
        break;
      } catch (error) {
        console.log(`Attempt ${retries + 1} failed:`, error);
        retries++;
        if (retries === maxRetries) {
          throw new Error("Failed to get response after maximum retries");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
      }
    }
    const trimmedResponse = response.match(/```json\n(.*?)```/s)[1];
    console.log(trimmedResponse);
    const completeItineraries = JSON.parse(trimmedResponse);
    const completeItinerariesWithImages = await getImages(completeItineraries);
    const itinerariesWithImages = completeItinerariesWithImages.itineraries;
    console.log(itinerariesWithImages);
    const daysCount = itinerariesWithImages.length;

    //for each location, get the coordinate
    const itinerariesFixedLocation = await Promise.all(
      itinerariesWithImages.map(async (itinerary) => ({
        ...itinerary,
        locations: await Promise.all(
          itinerary.locations.map(async (location) => ({
            ...location,
            coordinates: await scrapeCoordinate(location.name, city),
          }))
        ),
      }))
    );

    //update recommendation with itineraries
    await collection.updateOne(
      { _id: new ObjectId(recommendationId) },
      { $set: { daysCount, itineraries: itinerariesFixedLocation } }
    );

    const newRecommendation = await collection.findOne({
      _id: new ObjectId(recommendationId),
    });

    return newRecommendation;
  }

  static async getRecommendationDetails(id) {
    const collection = this.getCollection();
    const response = await collection.findOne({ _id: new ObjectId(id) });
    return response;
  }

  static async addRecommendationToMyTrip(payload) {
    const { userId, recommendationId } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!recommendationId) {
      throw {
        message: "Recommendation ID is required",
        code: "BAD_REQUEST",
      };
    }

    const recommendation = await collection.findOne({
      userId: new ObjectId(userId),
      _id: new ObjectId(recommendationId),
    });
    if (recommendation) {
      throw {
        message: "You have already added this recommendation to your trip",
        code: "BAD_REQUEST",
      };
    }

    await collection.updateOne(
      { _id: new ObjectId(recommendationId) },
      { $set: { userId } }
    );
    return `Successfully added to your trip`;
  }

  static async editItinerary(payload) {
    const { userId, recommendationId, newItineraries } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!recommendationId) {
      throw {
        message: "Itinerary ID is required",
        code: "BAD_REQUEST",
      };
    }
    if (!newItineraries) {
      throw {
        message: "New itineraries are required",
        code: "BAD_REQUEST",
      };
    }
    const itinerary = await collection.findOne({
      userId: new ObjectId(userId),
      _id: new ObjectId(recommendationId),
    });
    if (!itinerary) {
      throw {
        message: "Itinerary not found",
        code: "NOT_FOUND",
      };
    }
    let parsedItineraries;

    try {
      parsedItineraries = JSON.parse(newItineraries);
    } catch (error) {
      parsedItineraries = JSON.parse(newItineraries.replace(/'/g, '"'));
    }

    console.log(parsedItineraries);

    await collection.updateOne(
      { _id: new ObjectId(recommendationId) },
      { $set: { itineraries: parsedItineraries } }
    );
    return `Successfully edited itinerary`;
  }

  static async getMyTrips(userId) {
    const collection = this.getCollection();
    const response = await collection
      .find({ userId: new ObjectId(userId) })
      .toArray();
    return response;
  }

  static async generateViewAccess(id) {
    const collection = this.getCollection();
    const response = await collection.findOne({ _id: new ObjectId(id) });
    if (!response) {
      throw {
        message: "Recommendation not found",
        code: "NOT_FOUND",
      };
    }
    if (response.viewAccess) {
      return response.viewAccess;
    }
    const viewAccess = uid(20);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { viewAccess } }
    );
    return viewAccess;
  }

  static async checkViewAccess(payload) {
    const { recommendationId, viewAccess } = payload;
    const collection = this.getCollection();
    const response = await collection.findOne({
      _id: new ObjectId(recommendationId),
    });
    if (!response) {
      throw {
        message: "Recommendation not found",
        code: "NOT_FOUND",
      };
    }
    if (response.viewAccess !== viewAccess) {
      throw {
        message: "Invalid view access",
        code: "UNAUTHORIZED",
      };
    }
    return response;
  }

  static async shareItinerary(payload) {
    const { recommendationId, email, userId } = payload;
    const collection = this.getCollection();
    if (!userId) {
      throw {
        message: "You must be logged in",
        code: "UNAUTHORIZED",
      };
    }
    if (!recommendationId) {
      throw {
        message: "Recommendation ID is required",
        code: "BAD_REQUEST",
      };
    }
    const recommendation = await collection.findOne({
      _id: new ObjectId(recommendationId),
    });

    if (recommendation.userId !== userId) {
      throw {
        message: "You are not authorized to share this itinerary",
        code: "UNAUTHORIZED",
      };
    }
    if (!recommendation.viewAccess) {
      const viewAccess = await this.generateViewAccess(recommendationId);
    } else {
      viewAccess = recommendation.viewAccess;
    }
    //sendMail
    const user = await User.getUserDetails(userId);
    const daysCount = recommendation.daysCount;
    const city = recommendation.city;
    const country = recommendation.country;
    const fullName = user.fullName;
    const subject = `Trizzy: ${daysCount} days in ${city}, ${country}`;
    const link = `${process.env.BASE_CLIENT_URL}/recommendation/${recommendationId}?view-access=${viewAccess}`;
    try {
      sendMail(email, subject, fullName, city, country, daysCount, link);
    } catch (error) {
      console.log(error);
      throw {
        message: "Error sending email",
        code: "BAD_REQUEST",
      };
    }
  }
}
