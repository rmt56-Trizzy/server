import { getDB } from "../config/mongodb.js";
import EmailValidator from "email-validator";
import { comparePasssword, hashPassword } from "../helpers/bcryptjs.js";
import { signToken } from "../helpers/jwt.js";
import { OAuth2Client } from "google-auth-library";
import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";

export class User {
  static getCollection() {
    const db = getDB();
    const collection = db.collection("Users");
    return collection;
  }

  static async register(payload) {
    const { email, fullName, password } = payload;

    const collection = this.getCollection();

    if (!fullName || fullName.trim() === "") {
      throw {
        message: "Full name is required",
        code: "BAD_REQUEST",
      };
    }

    if (!email || email.trim() === "") {
      throw {
        message: "Email is required",
        code: "BAD_REQUEST",
      };
    }

    if (!EmailValidator.validate(email)) {
      throw {
        message: "Invalid email format",
        code: "BAD_REQUEST",
      };
    }

    const isExistingUserByEmail = await collection.findOne({ email });
    if (isExistingUserByEmail) {
      throw {
        message: "Email already registered",
        code: "BAD_REQUEST",
      };
    }

    if (!password || password.trim() === "") {
      throw {
        message: "Password is required",
        code: "BAD_REQUEST",
      };
    }

    if (password.trim().length < 5) {
      throw {
        message: "Password is not strong enough",
        code: "BAD_REQUEST",
      };
    }

    const hashPw = hashPassword(password);
    const newUser = {
      fullName,
      email,
      password: hashPw,
      freeTrial: 3,
    };

    await collection.insertOne(newUser);
    return "Register successful";
  }

  static async googleLogin(token) {
    const collection = this.getCollection();

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      throw {
        message: "Invalid token",
        code: "UNAUTHORIZED",
      };
    }

    const payload = ticket.getPayload();

    let user = await collection.findOne({
      googleAuth: payload.sub,
    });

    if (!user) {
      const newUser = {
        googleAuth: payload.sub,
        fullName: payload.name,
        email: payload.email,
        password: hashPassword(Math.random().toString(36).slice(-8)),
        freeTrial: 3,
      };

      const result = await collection.insertOne(newUser);
      user = {
        _id: result.insertedId,
        ...newUser,
      };
    }

    const access_token = signToken({
      id: user._id,
    });

    const result = {
      access_token,
      userId: user._id,
    };

    return result;
  }

  static async login(payload) {
    const { email, password } = payload;

    const collection = this.getCollection();

    if (!email || email.trim() === "") {
      throw {
        message: "Email is required",
        code: "BAD_REQUEST",
      };
    }

    if (!password || password.trim() === "") {
      throw {
        message: "Password is required",
        code: "BAD_REQUEST",
      };
    }

    const existingUser = await collection.findOne({ email });
    if (!existingUser) {
      throw {
        message: "Invalid email or password",
        code: "UNAUTHORIZED",
      };
    }

    const isPasswordValid = comparePasssword(password, existingUser.password);
    if (!isPasswordValid) {
      throw {
        message: "Invalid email or password",
        code: "UNAUTHORIZED",
      };
    }

    const access_token = signToken({ userId: existingUser._id });
    const token = {
      access_token,
      userId: existingUser._id,
    };
    return token;
  }

  static async getUserById(userId) {
    const collection = this.getCollection();
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      // throw new Error(
      //   JSON.stringify({ message: "User not found", code: "NOT_FOUND" })
      // );
      throw { message: "User not found", code: "NOT_FOUND" };
    }
    return user;
  }
}
