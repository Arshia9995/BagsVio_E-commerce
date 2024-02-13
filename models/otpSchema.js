const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: String,
  otp: String,
  CreatedAt: Date,
  expireAt: Date,
});
const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;