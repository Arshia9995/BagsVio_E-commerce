// const { render } = require("ejs")
const Product = require('../models/productSchema');
const Category=require('../models/categorySchema')


const express = require('express');
const router = express.Router();

// const { render } = require("ejs")

const credentials ={
    email:'admin@gmail.com',
    password:123
}



const toLogin = (req,res)=>{
    res.render('admin/adminlog')
}
const admindashboard = (req,res)=>{
    res.render('admin/admindashboard')
}
// const adminproduct = (req,res)=>{
//     res.render('admin/adminproduct')
// }
// const addproduct = (req,res)=>{
//     res.render('admin/addproduct')
// }
// const category = (req,res)=>{
//     res.render('admin/category')
// }

// const addcategory = (req,res)=>{
//     res.render('admin/addcategory')
// }

// const editcategory = (req,res)=>{
//     res.render('admin/editcategory')
// }

// const editproduct = (req,res)=>{
//     res.render('admin/editproduct')
// }


// Handle the form submission to add a new category
// const addcategory1= async (req, res) => {
//     try {
//         const { categoryName,  } = req.body;
//         console.log('Request Body:', req.body);
//         const newCategory = new Category({ categoryName });
//         await newCategory.save();
//         res.redirect('/admin/category');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// };


// const getCategoryList = async (req, res) => {
//     try {
//         // Fetch all categories from the database
//         const categories = await Category.find();

//         // Render the admin category view with the categories
//         res.render('admin/category', { categories });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// };







// Admin login post
const adminLogin = (req,res)=>{
    console.log(req.body)
    const {email,password}=req.body;

    if(email==credentials.email&&password==credentials.password){
        // return res.send('admin login successfull')
        req.session.isAdmin=true;
        res.redirect('/admin/admindashboard')
    }
}







module.exports={
    toLogin,
    adminLogin ,
    admindashboard,
    // adminproduct,
    // addproduct,
    // category,
    // addcategory,
    // editcategory,
    // editproduct,
    // addcategory1

}