const admin = require("../models/user");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();



const verifyadmin =  (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect("/admin")
    }
}


const adminExist =  (req, res, next) => {
    if (req.session.isAdmin) {
       
         res.redirect("/admin/admindashboard");
            } else {
        next();
    }
 };

module.exports = { verifyadmin,adminExist }