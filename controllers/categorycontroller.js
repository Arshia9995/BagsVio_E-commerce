
const express = require('express');
const router = express.Router();
const categoryModel=require("../models/categorySchema")


    module.exports={

        // fetching all categories

    category:async(req,res)=>{
        try {
            const categories = await categoryModel.find({})
            console.log(categories);
            res.render('./admin/category',{categories})            
        } catch (error) {
            console.error(`Error fetching categories: ${error.message}`);
            res.status(500).send('Internal Server Error');            
        }
    },

    getaddcategory:async (req,res)=>{
        try {
            res.render('./admin/addcategory')            
        } catch (error) {
            console.log(error);            
        }
    },

    postaddcategory: async (req, res) => {
        try {
            console.log(req.body, '.......................................................................');
            const existingCategory = await categoryModel.findOne({ categoryName: req.body.categoryName });
            if (existingCategory) {
                return res.render('./admin/addcategory', { error: 'Category already exists' });
            }
            const savecategory = await categoryModel.create(req.body);
            console.log("test");
            res.redirect("/admin/category");
        } catch (error) {
            console.log(error);
            // Optionally, handle other errors
            res.render('./admin/addcategory', { error: 'An error occurred' });
        }
    },
    
    editCategory: async(req,res)=>{
        const {id}= req.params
        console.log(req.body);
        try {
           const editCategory= await categoryModel.findById({_id :id})
           res.render('admin/editcategory',{editCategory})
        } catch (error) {
            console.log(error);  
        }
        
    },
    editedCategory:async(req,res)=>{
        const{id}=req.params
        const{categoryName}=req.body
        try {
            const updatecategory=await categoryModel.findByIdAndUpdate({_id:id},{categoryName:categoryName})
            res.redirect('/admin/category')
            
        } catch (error) {
            console.log(error); 
            
        }

    },

    deleteCategory:async (req,res)=>{
      
      const {id}=req.params
    //   console.log(id);
     await categoryModel.findOneAndDelete({_id:id})
    res.redirect("/admin/category")



    },

    BlockCategory: async (req, res) => {
        const categoryId = req.params.categoryId

        try {
            // Find the category by ID and update the isBlocked field
            await categoryModel.findByIdAndUpdate(categoryId, { isBlocked: true });

            res.redirect('/admin/category'); // Redirect to the category page or another appropriate location
        } catch (error) {
            console.error(`Error blocking category: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },
    UnblockCategory: async (req, res) => {
        const categoryId = req.params.categoryId;

        try {
            // Find the category by ID and update the isBlocked field
            await categoryModel.findByIdAndUpdate(categoryId, { isBlocked: false });

            res.redirect('/admin/category'); // Redirect to the category page or another appropriate location
        } catch (error) {
            console.error(`Error unblocking category: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },




}