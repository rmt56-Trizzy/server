import { GraphQLError } from "graphql";

export const errorHandler = (error) => {
  if (error.name === "JsonWebTokenError") {
    throw new GraphQLError("Invalid token", {
      extensions: {
        code: "UNAUTHORIZED",
        http: { status: 401 },
      },
    });
  }
  if (!error.message || !error.code) {
    throw new GraphQLError("Internal Server Error", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        http: { status: 500 },
      },
    });
  }
  const { message, code } = error;
  switch (code) {
    case "BAD_REQUEST":
      throw new GraphQLError(message, {
        extensions: {
          code,
          http: { status: 400 },
        },
      });
    case "UNAUTHORIZED":
      throw new GraphQLError(message, {
        extensions: {
          code,
          http: { status: 401 },
        },
      });
    case "FORBIDDEN":
      throw new GraphQLError(message, {
        extensions: {
          code,
          http: { status: 403 },
        },
      });
    case "NOT_FOUND":
      throw new GraphQLError(message, {
        extensions: {
          code,
          http: { status: 404 },
        },
      });
    default:
      throw new GraphQLError("Internal server error", {
        extensions: {
          code,
          http: { status: 500 },
        },
      });
  }
};
