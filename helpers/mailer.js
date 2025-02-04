import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
export function sendMail(
  to,
  subject,
  fullName,
  city,
  country,
  daysCount,
  link
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const source = fs.readFileSync("./helpers/emailFormat.html", "utf8");
  const template = handlebars.compile(source);
  const replacements = {
    fullName: fullName,
    city: city,
    country: country,
    daysCount: daysCount,
    link: link,
  };
  const htmlToSend = template(replacements);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlToSend,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}
