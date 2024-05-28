const user = require('../models/user')
const Product = require('../models/productSchema');
const category = require('../models/categorySchema');
const Address=require('../models/address')
const bcrypt = require('bcryptjs');
const sendOTP = require('./otpcontroller');
const Otp=require('../models/otpSchema');
const Users = require('../models/user');
const flash=require('express-flash')
const Wallet=require('../models/wallet')
const cart = require("../models/cartSchema")
const order = require("../models/order")
const ProductOffer = require('../models/productoffer'); 





module.exports ={


    getProductOfferPage:async(req,res)=>{
        try {
            const productOffers = await ProductOffer.find();

           
            
            res.render('./admin/productoffer',{ productOffers: productOffers, productOffer: {} , title:"Admin ProductOffer"});
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).send('Internal Server Error');
        }
        },
        getProduct:async(req,res)=>{
            try {
         
            const products = await Product.find({}, 'ProductName');

           
            const productNames = products.map(product => product.ProductName);
           
            res.json({ productNames });
                
            } catch (error) {
                
            }
    },
    postProductOffer:async(req,res)=>{
        try {
            const { productName, discountPercentage } = req.body;
            
            const product = await Product.findOne({ ProductName: productName });

            const newOffer = new ProductOffer({
                productName,
                discountPercentage
            });

        const currentPrice = product.Price; 
        const discount = (discountPercentage / 100) * currentPrice;
        const newPrice = currentPrice - discount;

        product.productofferPrice = newPrice
        product.productoffer = discountPercentage

        await product.save();
        await newOffer.save();
             
             res.redirect('/admin/productoffer')
            
        } catch (error) {
         console.error('Error adding offer:', error);
        
        res.status(500).json({ message: 'Failed to add offer' });
            
        }
    },
    posteditProductOffer: async (req, res) => {
        try {
            const { newProductName, newDiscountPercentage } = req.body;
    
            
            if (!newProductName || !newDiscountPercentage) {
                return res.status(400).json({ error: 'New product name and discount percentage are required' });
            }
            if (typeof newDiscountPercentage !== 'number' || newDiscountPercentage < 0 || newDiscountPercentage > 100) {
                return res.status(400).json({ error: 'Invalid discount percentage' });
            }
    
            
            const productOffer = await ProductOffer.findOne({ productName: newProductName });
    
            if (!productOffer) {
                return res.status(404).json({ error: 'Product offer not found' });
            }
    
        
            productOffer.discountPercentage = newDiscountPercentage;
            productOffer.productName = newProductName;
    
        
            await productOffer.save();
    
            
            res.redirect("/admin/productoffer");
        } catch (error) {
          
            console.error('Error editing product offer:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    

}


