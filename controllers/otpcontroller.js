const OTP=require("../models/otpSchema");
const generateOTP =require("../utility/generateOtp")
const sendEmail=require("../utility/mail")
//const bcrypt = require("bcrypt")
const {AUTH_EMAIL}=process.env;

const sendOTP = async (email) => {
    try {
        if (!email) {
            throw Error("Provide values for email");
        }
        // Clear old OTP
        await OTP.deleteOne({ email: email });
        console.log("Delete OTP and new OTP send");

        // Generate new OTP
        const generatedOTP = await generateOTP();

        // Sending email to the user
        const mailOptions = {
            from: AUTH_EMAIL,
            to: email,
            subject: "Verify the Email using this OTP",
            html: `<p>Hello new user, use this OTP to verify your email and continue:</p><b>${generatedOTP}</b><p>OTP will expire in 10 minutes</p>`,
        };
        await sendEmail(mailOptions);
        console.log(`Generated OTP: ${generatedOTP}`);

        // Save OTP record with TTL index
        const currentDate = new Date();
        const newDate = new Date(currentDate.getTime() + 2 * 60000); 
        const newOTP = await new OTP({
            email,
            otp: generatedOTP,
            CreatedAt: currentDate,
            expireAt: newDate,
        });

        // Save OTP record with TTL index
        const createdOTPrecord = await newOTP.save();

        // Ensure the TTL index is created
        await OTP.ensureIndexes();

        return createdOTPrecord;
    } catch (err) {
        throw err;
    }
};

module.exports=sendOTP;