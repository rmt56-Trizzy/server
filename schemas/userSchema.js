import { User } from "../models/User.js";
import { errorHandler } from "../helpers/errorHandler.js";

const userTypeDefs = `#graphql

    type User {
        _id:ID
        fullName: String!
        email: String!
        password : String!
    }

    input RegisterInput {
        email: String!
        fullName: String!
        password: String!
    }

    type AuthPayload {
        access_token: String!
        userId: ID!
    }
    
    input LoginInput {
      email: String!
      password: String!
    }

    type Mutation {
        register(input: RegisterInput): String
        googleLogin(token: String!): AuthPayload
        login(login: LoginInput): AuthPayload
        deductFreeTrial: Int
    }

    type Query {
        getUserById(_id: ID!): User
    }

`;

const userResolvers = {
  Query: {
    getUserById: async function (_, args) {
      try {
        const { _id } = args;
        const user = await User.getUserById(_id);
        return user;
      } catch (error) {
        console.log("🚀 ~ getUserById: ~ error:", error);
        errorHandler(error);
      }
    },
  },
  Mutation: {
    register: async (_, args) => {
      try {
        const { input } = args;

        const message = await User.register(input);
        return message;
      } catch (error) {
        console.log("🚀 ~ register: ~ error:", error);
        errorHandler(error);
      }
    },

    googleLogin: async (_, args) => {
      try {
        const { token } = args;

        const result = await User.googleLogin(token);
        return result;
      } catch (error) {
        console.log("🚀 ~ googleLogin: ~ error:", error);
        errorHandler(error);
      }
    },

    login: async (_, args) => {
      try {
        const { login } = args;

        const message = await User.login(login);
        return message;
      } catch (error) {
        console.log("🚀 ~ login: ~ error:", error);
        errorHandler(error);
      }
    },
    deductFreeTrial: async (_, __, context) => {
      try {
        const { _id: userId } = await context.authentication();
        const response = await User.deductFreeTrial(userId);
        return response;
      } catch (error) {
        console.log("🚀 ~ deductFreeTrial: ~ error:", error);
        errorHandler(error);
      }
    },
  },
};

export { userTypeDefs, userResolvers };
