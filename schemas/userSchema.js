import { User } from "../models/User.js";

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
        token: String!
        id: ID!
    }

    type Mutation {
        register(input: RegisterInput): String
        googleLogin(token: String!): AuthPayload
    }

    type Query {
        hello: String
    }

`;

const userResolvers = {
  Query: {
    hello: async () => {
      try {
        return "Hello World";
      } catch (error) {
        console.log("🚀 ~ getUser: ~ error:", error);
        return error;
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
        return error;
      }
    },

    googleLogin: async (_, args) => {
      try {
        const { token } = args;
        const result = await User.googleLogin(token);
        return result;
      } catch (error) {
        console.log("🚀 ~ googleLogin: ~ error:", error);
        return error;
      }
    },
  },
};

export { userTypeDefs, userResolvers };
