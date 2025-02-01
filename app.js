import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { userResolvers, userTypeDefs } from "./schemas/userSchema.js";
import {
  subscriptionTypeDefs,
  subscriptionResolvers,
} from "./schemas/subscriptionSchema.js";
import { chatTypeDefs, chatResolvers } from "./schemas/chatSchema.js";
import { verifyToken } from "./helpers/jwt.js";
import { User } from "./models/User.js";

const server = new ApolloServer({
  typeDefs: [userTypeDefs, subscriptionTypeDefs, chatTypeDefs],
  resolvers: [userResolvers, subscriptionResolvers, chatResolvers],
  introspection: true,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: process.env.PORT || 3005 },
  context: async ({ req, res }) => {
    const authN = async () => {
      const bearerToken = req.headers.authorization;
      if (!bearerToken) {
        throw new Error(
          JSON.stringify({
            message: "You must be logged in",
            code: "UNAUTHORIZED",
          })
        );
      }
      const [type, token] = bearerToken.split(" ");

      const { userId } = verifyToken(token);
      if (!userId) {
        throw new Error(
          JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
        );
      }
      const user = await User.getUserById(userId);
      if (!user) {
        throw new Error(
          JSON.stringify({ message: "Invalid token", code: "UNAUTHORIZED" })
        );
      }
      const { password, ...rest } = user;
      return rest;
    };

    return {
      authentication: () => authN(),
    };
  },
});

console.log(`🚀  Server ready at: ${url}`);
