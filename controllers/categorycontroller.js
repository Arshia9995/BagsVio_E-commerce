
const express = require('express');
const router = express.Router();
const categoryModel=require("../models/categorySchema")


    module.exports={

      

    category:async(req,res)=>{
        try {
            const categories = await categoryModel.find({})
          
            res.render('./admin/category',{categories, title:"Admin Category"})            
        } catch (error) {
            console.error(`Error fetching categories: ${error.message}`);
            res.status(500).send('Internal Server Error');            
        }
    },

    getaddcategory:async (req,res)=>{
        try {
            res.render('./admin/addcategory',{ title:"Admin AddCategory"})            
        } catch (error) {
            console.log(error);            
        }
    },

    postaddcategory: async (req, res) => {
        try {
          
            const existingCategory = await categoryModel.findOne({ categoryName: req.body.categoryName });
            if (existingCategory) {
                return res.render('./admin/addcategory', { error: 'Category already exists',title:"Admin Category" });
            }
            const savecategory = await categoryModel.create(req.body);
           
            res.redirect("/admin/category");
        } catch (error) {
            console.log(error);
           
            res.render('./admin/addcategory', { error: 'An error occurred' });
        }
    },
    
    editCategory: async(req,res)=>{
        const {id}= req.params
      
        try {
           const editCategory= await categoryModel.findById({_id :id})
           res.render('admin/editcategory',{editCategory, title:"Admin EditCategory"})
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
  
     await categoryModel.findOneAndDelete({_id:id})
    res.redirect("/admin/category")



    },

    BlockCategory: async (req, res) => {
        const categoryId = req.params.categoryId

        try {
           
            await categoryModel.findByIdAndUpdate(categoryId, { isBlocked: true });

            res.redirect('/admin/category'); 
        } catch (error) {
            console.error(`Error blocking category: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },
    UnblockCategory: async (req, res) => {
        const categoryId = req.params.categoryId;

        try {
           
            await categoryModel.findByIdAndUpdate(categoryId, { isBlocked: false });

            res.redirect('/admin/category');
        } catch (error) {
            console.error(`Error unblocking category: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },




}