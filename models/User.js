import { getDB } from "../config/mongodb.js";
import EmailValidator from "email-validator";
import { comparePasssword, hashPassword } from "../helpers/bcryptjs.js";
import { signToken } from "../helpers/jwt.js";
import { OAuth2Client } from "google-auth-library";

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
      throw new Error("Full name is required");
    }

    if (!email || email.trim() === "") {
      throw new Error("Email is required");
    }

    if (!EmailValidator.validate(email)) {
      throw new GraphQLError("Invalid email format");
    }

    const isExistingUserByEmail = await collection.findOne({ email });
    if (isExistingUserByEmail) {
      throw new GraphQLError("Email already used");
    }

    if (!password || password.trim() === "") {
      throw new GraphQLError("Password is required", {
        extensions: {
          code: "BAD REQUEST",
        },
      });
    }

    if (password.trim().length < 5) {
      throw new GraphQLError("Password at least 5 characters long");
    }

    const hashPw = hashPassword(password);
    const newUser = {
      fullName,
      email,
      password: hashPw,
      chatAllowens: 3,
    };

    await collection.insertOne(newUser);
    return "Register is success";
  }

  static async googleLogin(token) {
    const collection = this.getCollection();

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      throw { name: "BadRequest", message: "Invalid Google token" };
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
      throw new Error("Email is required");
    }

    if (!password || password.trim() === "") {
      throw new Error("Password is required");
    }

    const existingUser = await collection.findOne({ email });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const isPasswordValid = comparePasssword(password, existingUser.password);
    if (!isPasswordValid) {
      throw new Error("Password is incorrect");
    }

    const access_token = signToken({ userId: existingUser._id });
    const token = {
      access_token,
      userId: existingUser._id,
    };
    return token;
  }
}
