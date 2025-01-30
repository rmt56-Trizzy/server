import bcrypt from "bcryptjs";

export const hashPassword = (password) => {
  return bcrypt.hashSync(password);
};

export const comparePasssword = (pw, hashedPw) => {
  return bcrypt.compareSync(pw, hashedPw);
};
