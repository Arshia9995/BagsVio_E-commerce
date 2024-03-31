const productModel = require("../models/productSchema");
const categoryModel = require("../models/categorySchema");
// const { uploadSingle, uploadMultiple }  = require('../util/multer');
const Users = require("../models/user");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const Address = require("../models/address");
const Review = require('../models/review'); 

module.exports = {


    submitReview:async (req, res) => {
        try {
            const { userId } = req.session;
            const { productId, rating, reviewText } = req.body;
            console.log(req.body,"review")
    
            const review = new Review({
                productId,
                userId,
                rating,
                reviewText
            });
    
         
            await review.save();
    
          
            res.status(201).send({ message: 'Review submitted successfully,,,,,,,,,,,,,,,,' });
            
        } catch (error) {
            console.error('Error:', error);
          
            res.status(500).send({ error: 'Failed to submit review' });
        }
    }






}