const productModel = require("../models/productSchema");
const session = require("express-session");
const express = require("express");
const Cart = require("../models/cartSchema");
const Users = require("../models/user");
const Order = require("../models/order");
const brandModel = require("../models/brandSchema");
const categoryModel = require("../models/categorySchema");
const Address = require("../models/address");
const Wishlist=require("../models/wishlist")
const wallet=require("../models/wallet")
const Coupon = require("../models/coupon")



module.exports = {

  
  getCartPage: async (req, res) => {
    try {
      const { userId } = req.session; 
      
     
     
      let userCart = await Cart.findOne({ userId: userId }).populate(
        "items.productId"
      );

      
      const categories = await categoryModel.find();
     
     
      res.render("user/cart", { cart: userCart, categories });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  addToCart: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
   
     

      
      const product = await productModel.findById(productId)
      const user = await Users.findOne({ email: req.session.email });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = user._id;
      const userCart = await Cart.findOne({ userId: userId });

      const cartData = {
        productId: productId,
        quantity: quantity,
      };

      

      if (!userCart) {
        const newCart = new Cart({
          userId: userId,
          items: [cartData],
        });

        await newCart.save();
      } else {
        const existingProduct = userCart.items.find(
          (item) => item.productId.toString() === productId
        );

        if (existingProduct) {
          const totalQuantity = existingProduct.quantity + quantity;
    
                    if (totalQuantity > product.AvailableQuantity) {
                        return res.status(400).json({ error: 'Total quantity in the cart exceeds available stock' });
                    }
          existingProduct.quantity += quantity;

        } else {
          userCart.items.push({
            productId: productId,
            quantity: quantity,
          });
        }

        await userCart.save(); 
      }
      res
        .status(200)
        .json({
          success: true,
          message: "Product added to the cart successfully",
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeFromCart: async (req, res) => {
    try {
    
      const { userId } = req.session;
      const { productId } = req.body;
     

      const userCart = await Cart.findOne({ userId });
     

      if (!userCart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const updatedItems = userCart.items.filter(
        (item) => item.productId.toString() !== productId
      );
     

     
      if (userCart.items.length === updatedItems.length) {
        return res.status(404).json({ message: "Product not found in cart" });
      }

      userCart.items = updatedItems;
      await userCart.save();

      req.flash("success", "Product removed from cart successfully");
      res
        .status(200)
        .json({
          success: true,
          message: "Product removed from cart successfully",
        });
    } catch (err) {
     
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

 
  updateCartItemQuantity: async (req, res) => {
    try {
    
      const user = await Users.findOne({ email: req.session.email });
      const userId = user._id;

      const { itemId, newQuantity } = req.body;
   
      const cartItem = await Cart.findOneAndUpdate(
        { userId: userId, "items._id": itemId },
        { $inc: { "items.$.quantity": newQuantity } },
        { new: true }
      );

      if (!cartItem) {
        return res
          .status(404)
          .json({ success: false, message: "Item not found in the cart" });
      }
     
      return res
        .status(200)
        .json({
          success: true,
          message: "Quantity updated successfully",
          cartItem,
        });
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  checkStock:async (req, res) => {
    try {
      const items = req.body.items; 
  
      
      for (const item of items) {
        
        const product = await productModel.findById(item.itemId);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product with ID ${item.itemId} not found` });
        }
  
      
        if (item.quantity > product.availableQuantity) {
          return res.status(400).json({ success: false, message: `Not enough stock available for product ${product.name}` });
        }
      }
  
     
      res.json({ success: true, message: "All items have sufficient stock" });
    } catch (error) {
      console.error("Error checking stock:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },




getCheckOutPage: async (req, res) => {
  try {
      const { userId } = req.session;
      const email = req.session.email;
      const user = await Users.findOne({ email }).populate("addresses");
     
      const categories = await categoryModel.find();
      
      
      const coupons = await Coupon.find({users:{$ne:userId._id}});
     

     
      const Wallet = await wallet.findOne({ userId });
      const walletAmount = Wallet ? Wallet.balance : 0;

      const userCart = await Cart.findOne({ userId }).populate("items.productId");

      if(userCart.items.length===0){
        return res.redirect('/cart')
      }
       

      
      let totalPrice = 0;
      userCart.items.forEach((item) => {
          totalPrice += item.productId.Price * item.quantity;
      });

      req.session.couponApplied = null;
      req.session.discount = null;


      
      const paymentMethod = req.body.paymentMethod; 
      if (paymentMethod === "Wallet" && walletAmount < totalPrice) {
        
          return res.render("user/checkout", {
              userCart,
              addresses: user?.addresses?.addresses,
              error: "Insufficient wallet balance",
              walletAmount,
              totalPrice,
              coupons: coupons,
          });
      }

     
      res.render("user/checkout", {
          userCart,
          addresses: user?.addresses?.addresses,
          walletAmount,
          totalPrice,categories,
          coupons: coupons,
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
  }
},


  continueCheckOut: async (req, res) => {
  
    
    const email = req.session.email;
  
    discount=req.session.discount

   
    const user = await Users.findOne({ email: email }).populate("addresses");

   
    const selectedAddressId = req.body.selectedAddress;

   
    let selectedAddress;

   
    if (selectedAddressId) {
    
      selectedAddress = user.addresses.addresses.find((addr) =>
        addr._id.equals(selectedAddressId)
      );
    }

  

    const paymentMethod = req.body.paymentMethod;

  
    req.session.selectedAddress = selectedAddress;
    req.session.paymentMethod = paymentMethod;


    
 
    res.redirect("/placeorder");
  

  
}, 

  getPlaceOrderPage: async (req, res) => {
    try {
      const { userId } = req.session;
      const { selectedAddresses, paymentMethod } = req.session;
    
      let discount=req.session.discount
      let couponApplied
      const categories = await categoryModel.find();
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );

      if(userCart.items.length===0){
        return res.redirect('/cart')
      }
     
      let totalPrice = 0;  
      userCart.items.forEach((item) => {
        totalPrice += item.productId.price * item.quantity;
      });
      if(req.session.couponApplied){
     
        couponApplied = true
      }
     
      
      res.render("user/placeorder", {
        userCart,
        selectedAddresses,
        totalPrice,
        paymentMethod,
        discount,
        couponApplied,
        categories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server errror" });
    }
  },
  getPaymentSuccessPage: async (req, res) => {
    try {
      const { userId, productId, quantity } = req.session;

   
      const categories = await categoryModel.find();
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
      const existingProduct = await productModel.findById(productId);
      if (existingProduct) {
          existingProduct.AvailableQuantity -= quantity;
          await existingProduct.save();
        }
    
       
      if (req.session.paymentMethod === "Online Payment") {
        
      
        if (req.session.orderId) {
          
          const updatedOrder = await Order.findByIdAndUpdate(
            { _id: req.session.orderId },
            { $set: { paymentStatus: "Paid",op:"Placed" } },
            { new: true }
          );
          console.log(updatedOrder);
        }
      }
      req.session.couponApplied = null;
      req.session.discount = null;
      userCart.items = [];
      userCart.save()
      res.render("user/paymentsuccess", { categories, userCart});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server errror" });
    }
  },
  postCheckoutaddAddress: async (req, res) => {
    try {
    
      
      const { name, address, pincode, city, street, state, mobile } = req.body;
      const user = await Users.findOne({ email: req.session.email });
      const userId = user._id;
      let addressline = address;

      const userAddress = {
        name,
        addressline,
        street,
        city,
        state,
        pincode,
        mobile,
      };

      const userAddressFound = await Address.findOne({ userId: userId });

      if (userAddressFound) {
        userAddressFound.addresses.push(userAddress);
        await userAddressFound.save();
        
      } else {
        const newAddress = new Address({
          userId: userId,
          addresses: [userAddress],
        });
        user.addresses = newAddress._id
        await user.save()
        await newAddress.save();
       
      }
    
      return res.status(200).json({ success: true }); 
    } catch (error) {
      console.error("Error adding address:", error);
      res.status(500).send("Internal Server Error"); 
    }
  },
};
