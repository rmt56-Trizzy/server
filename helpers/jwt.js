import jwt from "jsonwebtoken";
const secretKey = process.env.JWT_SECRET;

export const signToken = (data) => {
  return jwt.sign(data, secretKey);
};

export const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};
