// const nodeMailer = require("nodemailer");
// const { AUTH_EMAIL, AUTH_PASS } = process.env;
// require("dotenv").config()

// let mailTransporter = nodeMailer.createTransport({
    
//     service: "gmail",
//     auth: {
//         user:process.env.AUTH_EMAIL,
//         pass:process.env.AUTH_PASS,
//     },
// });
// mailTransporter.verify((error, success) => {
//     if (error) {
//         console.log("error",error);
//     } else {
//         console.log("email ready");
//         // console.log(success);
//     }
// });
// const sendEmail = async (mailOptions) => {
//     try {
//         await mailTransporter.sendMail(mailOptions);
//         console.log("email send");
//         return;
//     } catch (err) {
//         throw err;
//     }
// };

// module.exports=sendEmail;



// const nodemailer = require("nodemailer");
// require("dotenv").config()
// // dotenv.config()


// const mailTransporter = nodemailer.createTransport({
//     host: "smtp-relay.brevo.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.BREVO_EMAIL,
//         pass: process.env.BREVO_API_KEY,
//     },
// });

// mailTransporter.verify((error, success) => {
//     if (error) {
//         console.log("SMTP error:", error);
//     } else {
//         console.log("SMTP ready");
//     }
// });

// const sendEmail = async (mailOptions) => {
//     try {
//         await mailTransporter.sendMail(mailOptions);
//         console.log("Email sent successfully");
//     } catch (error) {
//         console.log("Email error:", error);
//         throw error;
//     }
// };

// module.exports = sendEmail;




const brevo = require('@getbrevo/brevo');
require("dotenv").config();

// Initialize Brevo API
let apiInstance = new brevo.TransactionalEmailsApi();

// Set API key for authentication
apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEYY;

const sendEmail = async (mailOptions) => {
    try {
        // Create email object
        let sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.subject = mailOptions.subject;
        sendSmtpEmail.htmlContent = mailOptions.html;
        sendSmtpEmail.sender = { 
            name: "BagsVio Store", // Change this to your store name
            email: process.env.BREVO_EMAILL 
        };
        sendSmtpEmail.to = [{ email: mailOptions.to }];

        // Send email via Brevo API
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Email sent successfully via Brevo API");
        return data;
    } catch (error) {
        console.error("Email sending error:", error);
        throw error;
    }
};

module.exports = sendEmail;
