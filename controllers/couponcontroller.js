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
            console.log(coupons);
            res.render('./admin/coupon', { coupons: coupons , title:"Admin Coupons"});
        } catch (error) {
            console.error('Error fetching coupons:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    // postAddCoupon: async (req, res) => {
    //     try {
    //         // Extract coupon details from the request body
    //         const { couponName, couponCode, discountPercentage, maximumDiscountAmount, minimumPurchaseAmount, startDate, expirationDate } = req.body;
    
    //         // Validate coupon name
    //         if (!couponName || couponName.trim() === '') {
    //             return res.status(400).json({ error: 'Coupon name is required' });
    //         }
    
    //         // Validate coupon code
    //         if (!couponCode || couponCode.trim() === '') {
    //             return res.status(400).json({ error: 'Coupon code is required' });
    //         }
    
    //         // Validate discount percentage
    //         if (!discountPercentage || isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    //             return res.status(400).json({ error: 'Invalid discount percentage' });
    //         }
    
    //         // Validate maximum discount amount
    //         if (!maximumDiscountAmount || isNaN(maximumDiscountAmount) || maximumDiscountAmount < 0) {
    //             return res.status(400).json({ error: 'Invalid maximum discount amount' });
    //         }
    
    //         // Validate minimum purchase amount
    //         if (!minimumPurchaseAmount || isNaN(minimumPurchaseAmount) || minimumPurchaseAmount < 0) {
    //             return res.status(400).json({ error: 'Invalid minimum purchase amount' });
    //         }
    
    //         // Validate start date and expiration date
    //         const currentDate = new Date();
    //         const startDateObj = new Date(startDate);
    //         const expirationDateObj = new Date(expirationDate);
    
    //         if (isNaN(startDateObj) || isNaN(expirationDateObj) || startDateObj < currentDate || expirationDateObj <= startDateObj) {
    //             return res.status(400).json({ error: 'Invalid start date or expiration date' });
    //         }
    
    //         // Create the coupon in the database
    //         await Coupon.create(req.body);
            
    //         // Send success response
    //         console.log('Coupon added successfully');
    //         res.redirect('/admin/coupon'); // Redirect to the coupon page after adding
    //     } catch (error) {
    //         console.error('Error adding coupon:', error);
    //         res.status(500).send('Internal Server Error');
    //     }
    // },
    

    postAddCoupon: async (req, res) => {
        try {
            const couponDetails = req.body;
            console.log(couponDetails, '----');
            await Coupon.create(couponDetails);
            console.log('Coupon added successfully');
            res.redirect('/admin/coupon'); // Redirect to the coupon page after adding
        } catch (error) {
            console.error('Error adding coupon:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    // getCoupons:async (req, res) => {
    //     try {
          
    //         const coupons = await Coupon.find();
    //         console.log(coupons);
           
    //         return res.json(coupons);
    //     } catch (error) {
    //         // If an error occurs, send an error response
    //         console.error('Error fetching coupons:', error);
    //         res.status(500).json({ error: 'Internal Server Error' });
    //     }
    // },
     getuserCouponPage: async (req, res) => {
        try {
            const categories = await categoryModel.find();
            const coupons = await Coupon.find();
            console.log(coupons);
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
        // Check user authentication and retrieve user ID
        // console.log(req.session)
        const userId = req.session.userId._id; 
        console.log(userId);
        
    
        try {
            // Retrieve user's cart data from the database based on their user ID
            const userCart = await Cart.findOne({ userId }).populate("items.productId")
            console.log(userCart,"dfghj");
    
            // Check if the user's cart exists and is not empty
            if (!userCart || userCart.items.length === 0) {
                return res.status(400).json({ error: 'User cart not found or empty' });
            }

          
    
            const couponCode = req.body.couponCode;

            const coupon = await Coupon.findOne({ couponCode });
    
            // Check if the coupon exists
            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
    
            // Check if the coupon is valid
            const currentDate = new Date();
            if (coupon.expirationDate && coupon.expirationDate < currentDate) {
                return res.status(400).json({ error: 'Coupon has expired' });
            }
    
            // Apply discount to the total price
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
            console.log(updatedTotalPrice,"update");
            console.log(totalPrice,"total");
            console.log(discountAmount,"discount");
    

            req.session.discount=discountAmount
            // Return the updated total price with discount applied
            req.session.couponApplied = true
            return res.status(200).json({ totalPrice: updatedTotalPrice,discountAmount });
        } catch (error) {
            console.error('Error applying coupon:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    removeCoupon: async (req, res) => {
        try {
            // Retrieve user's cart data from the database based on their user ID
            const userId = req.session.userId._id;
            const userCart = await Cart.findOne({ userId }).populate("items.productId");
    
            // Check if the user's cart exists and is not empty
            if (!userCart || userCart.items.length === 0) {
                return res.status(400).json({ error: 'User cart not found or empty' });
            }
    
            // Remove discount applied to the total price
            let totalPrice = 0;
    
            if (userCart && userCart.items.length > 0) {
                for (const item of userCart.items) {
                    const productPrice = item.productId.Price;
                    totalPrice += productPrice * item.quantity;
                }
            }
    
            // Reset total price and discount session variables
            req.session.discount = 0;
            req.session.couponApplied = false;
    console.log(req.session.discount,"dissssssssssssssssssssss");
            // Return the updated total price with discount removed
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
            // Find the coupon by ID
            const coupon = await Coupon.findById(couponId);
            if (!coupon) {
                return res.status(404).json({ error: 'Coupon not found' });
            }
    
            // Update the coupon details
            coupon.couponName = couponName;
            coupon.couponCode = couponCode;
            coupon.discountPercentage = discountPercentage;
            coupon.maximumDiscountAmount = maximumDiscountAmount;
            coupon.minimumPurchaseAmount = minimumPurchaseAmount;
            coupon.startDate = new Date(startDate); // Convert string to Date object
            coupon.expirationDate = new Date(expirationDate); // Convert string to Date object
    
            // Save the updated coupon
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
    }
    

}
    




