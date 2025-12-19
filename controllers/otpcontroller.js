const OTP=require("../models/otpSchema");
const generateOTP =require("../utility/generateOtp")
const sendEmail=require("../utility/mail")
// dotenv.config()


const {AUTH_EMAIL}=process.env;

const sendOTP = async (email) => {
    try {
        if (!email) {
            throw Error("Provide values for email");
        }
      
        await OTP.deleteOne({ email: email });
        console.log("Delete OTP and new OTP send");

      
        const generatedOTP = await generateOTP();

        const mailOptions = {
            from: process.env.BREVO_EMAIL,
            to: email,
            subject: "Verify the Email using this OTP",
            html: `<p>Hello new user, use this OTP to verify your email and continue:</p><b>${generatedOTP}</b><p>OTP will expire in 10 minutes</p>`,
        };
        await sendEmail(mailOptions);
        console.log("OTP email sent to:", email);
      

       
        const currentDate = new Date();
        
        const newDate = new Date(currentDate.getTime() + 2 * 60000); 
        const newOTP = await new OTP({
            email,
            otp: generatedOTP,
            CreatedAt: currentDate,
            expireAt: newDate,
        });

      
        const createdOTPrecord = await newOTP.save();

        
        await OTP.ensureIndexes();

        return createdOTPrecord;
    } catch (err) {
        throw err;
    }
};

module.exports=sendOTP;