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

    type Mutation {
        register(input: RegisterInput): String
    }

`;

const userResolvers = {
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
  },
};

export { userTypeDefs, userResolvers };
