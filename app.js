const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const userRouter = require('./routes/userrouter')
const adminRouter = require('./routes/adminrouter')
const {urlencoded} = require('body-parser')
const mongoose = require('mongoose')
const flash = require('express-flash');
const cookieParser = require('cookie-parser')
const path= require('path')
const dotenv = require('dotenv');
const session = require('express-session');
const logger = require('morgan')
const connectdb=require('./config/db')
const nodemailer=require('nodemailer')
dotenv.config()


app.use(session({
  secret: 'your-secret-key', // Change this to a secret key for session encryption
  resave: false,
  saveUninitialized: true,
}));
app.use(logger("dev"));
app.use(urlencoded({ extended: true }));
app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store');
  next();
});

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
// app.use(bodyParser.urlencoded({extended:true}))
// app.use(bodyParser.json())

app.use(flash());
connectdb();
 

app.use('/magnific-popup', express.static(path.join(__dirname, 'node_modules/magnific-popup/dist')));



app.use('/',userRouter.router)
app.use('/admin',adminRouter.admin)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
