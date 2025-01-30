import { getDB } from "../config/mongodb.js";
import EmailValidator from "email-validator";
import { comparePasssword, hashPassword } from "../helpers/bcryptjs.js";
import { signToken } from "../helpers/jwt.js";

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
    };

    await collection.insertOne(newUser);
    return "Register is success";
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

    const accessToken = signToken({ userId: existingUser._id });
    const token = {
      accessToken,
      userId: existingUser._id,
    };
    return token;
  }
}
