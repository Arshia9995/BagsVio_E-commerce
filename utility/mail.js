const nodeMailer = require("nodemailer");
const { AUTH_EMAIL, AUTH_PASS } = process.env;
require("dotenv").config()

let mailTransporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user:process.env.AUTH_EMAIL,
        pass:process.env.AUTH_PASS,
    },
});
mailTransporter.verify((error, success) => {
    if (error) {
        console.log("error",error);
    } else {
        console.log("email ready");
        // console.log(success);
    }
});
const sendEmail = async (mailOptions) => {
    try {
        await mailTransporter.sendMail(mailOptions);
        console.log("email send");
        return;
    } catch (err) {
        throw err;
    }
};

module.exports=sendEmail;