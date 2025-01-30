import { User } from "../models/User.js";

const userTypeDefs = `#graphql

    type User {
        _id:ID
        fullName: String!
        email: String!
        password : String!
    }
    
    type Login {
        accessToken: String!
        userId: ID!
    }

    input RegisterInput {
        email: String!
        fullName: String!
        password: String!
    }

    input LoginInput {
    email: String
    password: String
    }

    type Mutation {
        register(input: RegisterInput): String
        login(login: LoginInput): Login
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
    login: async (_,args) => {
      try {
        const { login } = args;

        const message = await User.login(login);
        return message;
      } catch (error) {
        console.log("🚀 ~ login: ~ error:", error);
        return error;
      }
    },
  },
};

export { userTypeDefs, userResolvers };
