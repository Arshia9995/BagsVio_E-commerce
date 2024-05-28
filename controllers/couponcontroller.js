const categoryModel = require("../models/categorySchema");
const productModel = require("../models/productSchema");
const Users = require("../models/user");
const Order = require("../models/order");
const Coupon = require("../models/coupon")
const Cart = require("../models/cartSchema");




module.exports = {
    getCouponPage: async (req, res) => {
        try {
            
            const coupons = await Coupon.find();
           
            res.render('./admin/coupon', { coupons: coupons , title:"Admin Coupons"});
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    

    postAddCoupon: async (req, res) => {
        try {
            const couponDetails = req.body;
           
            await Coupon.create(couponDetails);
          
            res.redirect('/admin/coupon'); 
        } catch (error) {
            console.error('Error adding coupon:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    
     getuserCouponPage: async (req, res) => {
        try {

            const userId = req.session.userId
            const categories = await categoryModel.find();
           
            const coupons = await Coupon.find({users:{$ne:userId}});


           
            const userEmail = req.session.email;
            const user = await Users.findOne({ email: userEmail });
            res.render('user/coupon', { user, categories, coupons: coupons});
            req.session.email = userEmail;
        } catch (err) {
            console.error('Error fetching user details:', err);
            res.status(500).send('Internal Server Error');
        }
    },

    postApplyCoupon: async (req, res) => {
       
       
        const userId = req.session.userId._id; 
        try {
            const userCart = await Cart.findOne({ userId }).populate("items.productId")
            if (!userCart || userCart.items.length === 0) {
                return res.status(400).json({ error: 'User cart not found or empty' });
            }
            const couponCode = req.body.couponCode;
            const coupon = await Coupon.findOne({ couponCode });
            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
            const currentDate = new Date();
            if (coupon.expirationDate && coupon.expirationDate < currentDate) {
                return res.status(400).json({ error: 'Coupon has expired' });
            }
            let totalPrice = 0;
          if (userCart && userCart.items.length > 0) {
              for (const item of userCart.items) {
                  const productPrice =  item.productId.Price ;
                  totalPrice += productPrice * item.quantity;
              }
          }
          if (totalPrice < coupon.minimumPurchaseAmount) {
            return res.status(400).json({ error: `Minimum purchase amount required: ₹${coupon.minimumPurchaseAmount}` });
        }
          

            let discountAmount = (totalPrice * coupon.discountPercentage) / 100;

            if ( discountAmount > coupon.maximumDiscountAmount) {
                discountAmount = coupon.maximumDiscountAmount;
            }

            const updatedTotalPrice = totalPrice - discountAmount;
           
    

            req.session.discount=discountAmount
           
            req.session.couponApplied = true;
            req.session.couponCode = couponCode;

            return res.status(200).json({ totalPrice: updatedTotalPrice,discountAmount });
        } catch (error) {
            console.error('Error applying coupon:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    removeCoupon: async (req, res) => {
        try {
           
            const userId = req.session.userId._id;
            const userCart = await Cart.findOne({ userId }).populate("items.productId");
    
          
            if (!userCart || userCart.items.length === 0) {
                return res.status(400).json({ error: 'User cart not found or empty' });
            }
    
           
            let totalPrice = 0;
    
            if (userCart && userCart.items.length > 0) {
                for (const item of userCart.items) {
                    const productPrice = item.productId.Price;
                    totalPrice += productPrice * item.quantity;
                }
            }
    
           
            req.session.discount = 0;
            req.session.couponApplied = false;
  
           
            return res.status(200).json({ totalPrice: totalPrice });
        } catch (error) {
            console.error('Error removing coupon:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    postEditCoupon:async (req, res) => {
        const couponId = req.params.couponId;
        const { couponName, couponCode, discountPercentage, startDate, expirationDate,maximumDiscountAmount,minimumPurchaseAmount } = req.body;
    
        try {
          
            const coupon = await Coupon.findById(couponId);
            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
    
         
            coupon.couponName = couponName;
            coupon.couponCode = couponCode;
            coupon.discountPercentage = discountPercentage;
            coupon.maximumDiscountAmount = maximumDiscountAmount;
            coupon.minimumPurchaseAmount = minimumPurchaseAmount;
            coupon.startDate = new Date(startDate); 
            coupon.expirationDate = new Date(expirationDate); 
    
            
            await coupon.save();
    
            res.redirect("/admin/coupon")
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
    postdeletecoupon:async (req, res) => {
        const couponId = req.params.couponId;
    
        try {
            
            await Coupon.findByIdAndDelete(couponId);
            res.status(200).send('Coupon deleted successfully');
        } catch (error) {
            console.error('Error deleting coupon:', error);
            res.status(500).send('Failed to delete coupon');
        }
    },
    getcoupons:async (req, res) => {
        try {
         
            const userId = req.session.userId
            const coupons = await Coupon.find({users:{$ne:userId}});
            res.json(coupons); 
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    

}
    




