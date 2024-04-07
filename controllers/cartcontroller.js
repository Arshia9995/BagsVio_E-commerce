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



module.exports = {

  
  getCartPage: async (req, res) => {
    try {
      const { userId } = req.session; // Use user instead of userId
      console.log(userId);

      let userCart = await Cart.findOne({ userId: userId }).populate(
        "items.productId"
      );

      // req.session.user=userId
      // if (!userCart) {
      //   userCart = new Cart({ userId, items: [] });
      // }
      const categories = await categoryModel.find();
      // console.log("Categories:", categories);
      console.log(userCart,"usercart")
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
      // console.log(req.body)
      console.log(quantity, "quaty");

      // console.log('req.session.email:', req.session.email);

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

      // console.log('cartData', cartData);

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
          existingProduct.quantity += quantity;
        } else {
          userCart.items.push({
            productId: productId,
            quantity: quantity,
          });
        }

        await userCart.save(); // Save the entire userCart after making changes
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
      console.log(
        "entered cart......>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>."
      );
      const { userId } = req.session;
      const { productId } = req.body;
      //  console.log((userId));
      //  console.log(productId);

      const userCart = await Cart.findOne({ userId });
      // console.log(userCart);

      if (!userCart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const updatedItems = userCart.items.filter(
        (item) => item.productId.toString() !== productId
      );
      console.log(updatedItems);

      // console.log(updatedItems);
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
      // console.log("not entered cart.......")
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Update quantity of an item in the cart
  updateCartItemQuantity: async (req, res) => {
    try {
      console.log("backend reached in cart update quantity", req.body);
      const user = await Users.findOne({ email: req.session.email });
      const userId = user._id;

      const { itemId, newQuantity } = req.body;
      // Find the cart item by both userId and itemId
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
      console.log("quantity updated");
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
  // Update the getCheckOutPage controller function
getCheckOutPage: async (req, res) => {
  try {
      const { userId } = req.session;
      const email = req.session.email;
      const user = await Users.findOne({ email }).populate("addresses");
      const categories = await categoryModel.find();
      console.log(user,'=-=---=-=-==================');

      // Retrieve user's wallet amount
      const Wallet = await wallet.findOne({ userId });
      const walletAmount = Wallet ? Wallet.balance : 0;

      const userCart = await Cart.findOne({ userId }).populate("items.productId");
       

      // Calculate total price of items in the cart
      let totalPrice = 0;
      userCart.items.forEach((item) => {
          totalPrice += item.productId.Price * item.quantity;
      });


      // Check if the payment method is wallet and wallet balance is sufficient
      const paymentMethod = req.body.paymentMethod; // Assuming payment method is sent in the request body
      if (paymentMethod === "Wallet" && walletAmount < totalPrice) {
          // Wallet balance is insufficient
          return res.render("user/checkout", {
              userCart,
              addresses: user?.addresses?.addresses,
              error: "Insufficient wallet balance",
              walletAmount,
              totalPrice,
          });
      }

      // Render the checkout page
      res.render("user/checkout", {
          userCart,
          addresses: user?.addresses?.addresses,
          walletAmount,
          totalPrice,categories
      });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
  }
},


  continueCheckOut: async (req, res) => {
    console.log("bhbnjbjbnjbnhj............................");
    
    const email = req.session.email;
    console.log(req.body, "body---------");
    discount=req.session.discount

    // const savedAddress = await newAddress.save();

    // Find the user by email and populate their addresses
    const user = await Users.findOne({ email: email }).populate("addresses");

    // Retrieve the selected address ID from the request body
    const selectedAddressId = req.body.selectedAddress;

    // Initialize variable to hold the selected address
    let selectedAddress;

    // Check if an address ID was provided
    if (selectedAddressId) {
      // Find the selected address from the user's addresses array
      selectedAddress = user.addresses.addresses.find((addr) =>
        addr._id.equals(selectedAddressId)
      );
    }

    console.log("my address", selectedAddress);

    const paymentMethod = req.body.paymentMethod;

    // Store the selected address ID and payment method in the session
    req.session.selectedAddress = selectedAddress;
    req.session.paymentMethod = paymentMethod;


    
 
    res.redirect("/placeorder");
  

  
}, 

  getPlaceOrderPage: async (req, res) => {
    try {
      const { userId } = req.session;
      const { selectedAddresses, paymentMethod } = req.session;
      // const selectedAddress = await Address.findById(selectedAddressId);
      let discount=req.session.discount
      let couponApplied
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
      console.log(discount);
      let totalPrice = 0;  
      userCart.items.forEach((item) => {
        totalPrice += item.productId.price * item.quantity;
      });
      if(req.session.couponApplied){
        console.log("inside couponApplied");
        couponApplied = true
      }
     
      console.log(totalPrice);
      console.log(userId, "id....................");
      console.log(userCart, "cart............");
      res.render("user/placeorder", {
        userCart,
        selectedAddresses,
        totalPrice,
        paymentMethod,
        discount,
        couponApplied
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server errror" });
    }
  },
  getPaymentSuccessPage: async (req, res) => {
    try {
      const { userId } = req.session;
      const categories = await categoryModel.find();
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
      console.log(req.session.paymentMethod, "=========================");
      if (req.session.paymentMethod === "Online Payment") {
        const order = await Order.findOne({ userId, paymentStatus: "pending" });
        console.log(order,'===================');
        if (order) {
          // Update paymentStatus to paid
          const updatedOrder = await Order.findByIdAndUpdate(
            { _id: order._id },
            { $set: { paymentStatus: "paid" } },
            { new: true }
          );
          console.log(updatedOrder);
          // Optionally, update orderStatus to orderPlaced here
        }
      }
      res.render("user/paymentsuccess", { categories, userCart });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server errror" });
    }
  },
  postCheckoutaddAddress: async (req, res) => {
    try {
      console.log("backend reached>>>>>>>>>>>>");
      // Extract new address data from the request body
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
        console.log("Address saved for existing user");   
      } else {
        const newAddress = new Address({
          userId: userId,
          addresses: [userAddress],
        });
        user.addresses = newAddress._id
        await user.save()
        await newAddress.save();
        console.log("New address created");
      }
      console.log("success bro set");
      return res.status(200).json({ success: true }); // Send success response
    } catch (error) {
      console.error("Error adding address:", error);
      res.status(500).send("Internal Server Error"); // Send error response
    }
  },
};
