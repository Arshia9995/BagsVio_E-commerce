
const express = require('express');
const router = express.Router();
const brandModel=require("../models/brandSchema")

module.exports={

    Brand:async(req,res)=>{
       try{
        const brands=await brandModel.find({})
        var i=0
       
        res.render('./admin/brand',{brands,i, title:"Admin Brand"})
       }catch(err){
        console.log(err)
       }
    },
    getaddBrand:async (req,res)=>{
        try {
            res.render('./admin/addbrand',{ title:"Admin AddBrand"})            
        } catch (error) {
            console.log(error);            
        }
    },
    postaddBrand: async (req, res) => {
        try {
         
          const existingBrand = await brandModel.findOne({ brandName: req.body.brandName });
          if (existingBrand) {
            return res.render('./admin/addbrand', { error: 'Brand already exists',title:"Admin Brand" });
        }
          
          if (req.body.brandName !== null) {
            const savebrand = await brandModel.create(req.body);
          
            res.redirect('/admin/brand');
          } else {
            console.error('BrandName cannot be null.');
          
            res.status(400).send('BrandName cannot be null.');
          }
        } catch (error) {
          console.log(error);
          
          res.status(500).send('Internal Server Error');
        }
      
      






    },
    editBrand: async(req,res)=>{
        const {id}= req.params
       
        try {
           const editbrand= await brandModel.findById({_id :id})
           res.render('admin/editbrand',{editbrand, title:"Admin EditBrand"})
        } catch (error) {
            console.log(error);  
        }
        
    },
    editedBrand:async(req,res)=>{
        const{id}=req.params
        const{brandName}=req.body
        try {
            const updatebrand=await brandModel.findByIdAndUpdate({_id:id},{brandName:brandName})
            res.redirect('/admin/brand')
            
        } catch (error) {
            console.log(error); 
            
        }

    },
    deleteBrand:async(req,res)=>{
        const {id}=req.params
       
        await brandModel.findOneAndDelete({_id:id})
        res.redirect('/admin/brand')

    },


    Blockbrand: async (req, res) => {
        const brandId = req.params.brandId

        try {
           
            await brandModel.findByIdAndUpdate(brandId, { isBlocked: true });

            res.redirect('/admin/brand'); 
        } catch (error) {
            console.error(`Error blocking brand: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },
    Unblockbrand: async (req, res) => {
        const brandId = req.params.brandId;

        try {
           
            await brandModel.findByIdAndUpdate(brandId, { isBlocked: false });

            res.redirect('/admin/brand'); 
        } catch (error) {
            console.error(`Error unblocking brand: ${error.message}`);
            res.status(500).send('Internal Server Error');
        }
    },

}