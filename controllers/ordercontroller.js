const productModel = require("../models/productSchema");
const categoryModel = require("../models/categorySchema");

const Users = require("../models/user");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const Address = require("../models/address");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../models/wallet");

var instance = new Razorpay({
  key_id: "rzp_test_5R2m8IF7tYZkkO",
  key_secret: "vEuAoYjZMP6ghEwU8P1tVbm5",
});

module.exports = {
  placeOrder: async (req, res) => {
    try {
      const { userId } = req.session;
    
      const { selectedAddress, paymentMethod } = req.session;
    
      const discount = req.session.discount;
     
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
    
      let totalPrice = 0;
      userCart.items.forEach((item) => {
      
        totalPrice += item.productId.Price * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);
      

     
      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );

      const productsToUpdate = userCart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.Price,
      }));

      
      req.session.grantTotal = totalPrice;
      req.session.amounttopay = totalPrice;

     

      if (paymentMethod === "Cash On Delivery") {
        const newOrder = new Order({
          userId: userId,
          products: productsToUpdate,
          totalPrice: totalPrice,

          shippingAddress: {
            name: addressDetails.addresses[0].name,
            addressline: addressDetails.addresses[0].addressline,
            street: addressDetails.addresses[0].street,
            city: addressDetails.addresses[0].city,
            state: addressDetails.addresses[0].state,
            pincode: addressDetails.addresses[0].pincode,
            mobile: addressDetails.addresses[0].mobile,
          },
          paymentMethod: paymentMethod,
          discount: discount,
        });

        for (const product of productsToUpdate) {
          const existingProduct = await productModel.findById(
            product.productId
          );
         
          if (existingProduct) {
            existingProduct.AvailableQuantity -= product.quantity;
            await existingProduct.save();
          }
        }

        await newOrder.save();
      

        userCart.items = [];
        await userCart.save();
        if (req.session.paymentMethod === "Online Payment") {
          return res.redirect("/makePayment");
        } else {
          delete req.session.selectedAddress;
          delete req.session.paymentMethod;

          res.redirect("/paymentsuccess");
        }
      } else if (paymentMethod === "Wallet") {
        const userWallet = await Wallet.findOne({ userId });
      

        if (!userWallet) {
          return res
            .status(400)
            .json({ error: "Wallet not found for the user" });
        }
      
        userWallet.balance -= totalPrice;

       
        const newOrder = new Order({
          userId: userId,
          products: productsToUpdate,
          totalPrice: totalPrice,

          shippingAddress: {
            name: addressDetails.addresses[0].name,
            addressline: addressDetails.addresses[0].addressline,
            street: addressDetails.addresses[0].street,
            city: addressDetails.addresses[0].city,
            state: addressDetails.addresses[0].state,
            pincode: addressDetails.addresses[0].pincode,
            mobile: addressDetails.addresses[0].mobile,
          },
          paymentMethod: paymentMethod,
          discount: discount,
          paymentStatus: "Paid",
        });

        await newOrder.save();
        userCart.items = [];
        await userCart.save();
        for (const product of productsToUpdate) {
          const existingProduct = await productModel.findById(
            product.productId
          );
         
          if (existingProduct) {
            existingProduct.AvailableQuantity -= product.quantity;
            await existingProduct.save();
          }
        }
        
        const orderId = newOrder._id; 

      
        const transaction = {
          transactionType:'debit',
          amount: totalPrice,
          date: new Date(),
          from: "Wallet",
          orderId: orderId, 
        };
      

       
        userWallet.transactions.push(transaction);
      

      
        await userWallet.save();
      
        return res.redirect("/paymentsuccess");
      } else {
       
        return res.status(400).json({
          error: "Insufficient balance in wallet or invalid payment method",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  showOrdersPage: async (req, res) => {
    const { userId } = req.session;
    const categories = await categoryModel.find();

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    try {
        const totalOrders = await Order.countDocuments({ userId });
        const totalPages = Math.ceil(totalOrders / limit);

        const order = await Order.find({ userId, 
          $or: [
          { paymentMethod: { $ne: "Online Payment" } }, 
          { op: { $ne: "Pending" } }
      ] })
            .populate("products.productId")
            .sort({ orderDate: -1 })
            .skip(skip)
            .limit(limit);

        res.render("user/orders", { categories, order, totalPages, currentPage: page });
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Internal server error" });
    }
},

  showOrderDetailsPage: async (req, res) => {
    const { userId } = req.session;
    const { orderId, productId } = req.params;
  
    const discount = req.session.discount;

    try {
      const categories = await categoryModel.find();
      const user = await Users.findOne({ _id: userId });
     
      const order = await Order.findOne({ _id: orderId, userId }).populate(
        "products.productId"
      );
     
      if (order) {
        res.render("user/orderdetails", { order ,categories});
      } else {
        res.status(404).json({ error: "Order not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  cancelOrder: async (req, res) => {
    const { orderId } = req.params;
    const userId = req.session.userId;
    const {totalPrice} = req.body
    console.log(totalPrice,"wwwwwwwwwwww");
    

    try {
      if (req.body.paymentMethod == "Online Payment" || req.body.paymentMethod == 'Wallet') {
        const canceledOrder = await Order.findByIdAndUpdate(orderId, {
          status: "Cancelled",
          paymentStatus: "Cancelled",
        }).populate("products.productId");

        if (!canceledOrder) {
          return res.status(404).json({ message: "Order not found" });
        }

        for (const item of canceledOrder.products) {
          
          const productId = item.productId._id;
      
          const canceledQuantity = item.quantity;

         
          const product = await productModel.findById(productId);
          if (product) {
           
            product.AvailableQuantity += canceledQuantity;
            await product.save();
          }
        }
        const userWallet = await Wallet.findOne({ userId: userId });
    

        if (!userWallet) {
          return res
            .status(400)
            .json({ error: "Wallet not found for the user" });
        }
        // let totalRefundAmount = 0;
        // canceledOrder.products.forEach((item) => {
        //   totalRefundAmount += item.price * item.quantity;
        // });
        userWallet.balance += Number(totalPrice);
        const refundTransaction = {
          transactionType: "credit",
          amount: Number(totalPrice),
          date: new Date(),
          from: "Refund for cancel",
          orderId: orderId,
        };

        userWallet.transactions.push(refundTransaction)
        await userWallet.save();
      } else {
        const canceledOrder = await Order.findByIdAndUpdate(orderId, {
          status: "Cancelled",
          paymentStatus: "Cancelled",
        }).populate("products.productId");
      }
      res.status(200).json({success:true, message: "Order cancelled successfully" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
   
  },
  returnOrder: async (req, res) => {
    const { orderId } = req.params;
   

    try {
      const returnedOrder = await Order.findByIdAndUpdate(orderId, {
        status: "Returned",
        paymentStatus: "Refunded",
      }).populate("products.productId");

     
      if (!returnedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

     
      returnedOrder.status = "Returned";
      returnedOrder.paymentStatus = "Refunded";
      await returnedOrder.save();

      
      for (const item of returnedOrder.products) {
       
        const productId = item.productId;
        const returnedQuantity = item.quantity;

        
        const product = await productModel.findById(productId);
        if (product) {
        
          product.AvailableQuantity += returnedQuantity;
          await product.save();
        }
      }

      
      let refundAmount = 0;
      for (const item of returnedOrder.products) {
        refundAmount += item.price * item.quantity;
      }

     
      const userWallet = await Wallet.findOne({ userId: returnedOrder.userId });
      if (!userWallet) {
        return res.status(404).json({ error: "User's wallet not found" });
      }
      userWallet.balance += refundAmount;
      await userWallet.save();

    
      const transaction = {
        transactionType: "credit",
        amount: refundAmount,
        from: `Refund for return `,
        orderId: returnedOrder._id,
      };
      userWallet.transactions.push(transaction);
      await userWallet.save();

     
     
      res
        .status(200)
        .json({ message: "Order returned successfully", refundAmount });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: err });
    }
  },

  adminOrderPage: async (req, res) => {
    try {

      const page = parseInt(req.query.page) || 1; 
      const perPage = 10; 

      const orders = await Order.find({op:"Placed"})
            .populate("products.productId")
            .populate("userId")
            .skip((page - 1) * perPage) 
            .limit(perPage); 

          
            const ordersCount = await Order.countDocuments();
            const totalPages = Math.ceil(ordersCount / perPage);

      res.render("admin/order", { orders, title:"Admin Orders Page",currentPage: page, totalPages ,perPage});
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  adminOrderViewPage: async (req, res) => {
    const orderId = req.params.orderId;

    try {
     
      const orders = await Order.findById(orderId).populate(
        "products.productId"
      );

      if (!orders) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.render("admin/orderview", { orders , title:"Admin OrderView"});
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  updateOrderStatus: async (req, res) => {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
  
  
    try {
      const orders = await Order.findByIdAndUpdate(
        orderId,
        { status: newStatus },
        { new: true }
      );

      if (!orders) {
        return res.status(404).json({ error: "Order not found" });
      }

    
      
      if (newStatus === "Delivered") {
        orders.paymentStatus = "Paid";
      } else if (
        newStatus === "Pending" ||
        newStatus === "Processing" ||
        newStatus === "Shipped"
      ) {
        orders.paymentStatus = "Pending";
      }

     
      await orders.save();

      res.json({
        order: orders,
        paymentStatus: orders.paymentStatus, 
      });

    
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  makePayment: async (req, res) => {
    try {
      const { userId } = req.session;
    
      const { selectedAddress, paymentMethod } = req.session;
  
      const discount = req.session.discount;
     
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
    
      let totalPrice = 0;
      userCart.items.forEach((item) => {
        console.log("item", item);
        totalPrice += item.productId.Price * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);
  
      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );

      const productsToUpdate = userCart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.Price,
      }));

     
      req.session.grantTotal = totalPrice;
      req.session.amounttopay = totalPrice;

      const newOrder = new Order({
        userId: userId,
        products: productsToUpdate,
        totalPrice: totalPrice,

        shippingAddress: {
          name: addressDetails.addresses[0].name,
          addressline: addressDetails.addresses[0].addressline,
          street: addressDetails.addresses[0].street,
          city: addressDetails.addresses[0].city,
          state: addressDetails.addresses[0].state,
          pincode: addressDetails.addresses[0].pincode,
          mobile: addressDetails.addresses[0].mobile,
        },
        paymentMethod: paymentMethod,
        paymentStatus: "Paid",
        op:"Pending",
        discount: discount,
      });
      
      for (const product of productsToUpdate) {
        req.session.productId = product.productId;
        req.session.quantity = product.quantity
       
      }
      
      await newOrder.save();
      console.log("ddddddd now my order details", newOrder);
      req.session.orderId = newOrder._id

      // userCart.items = [];
      await userCart.save();
      let total = 0;
      if (req.session.amounttopay === 0 || !req.session.amounttopay) {
        console.log("code is here and :", req.session.grantTotal);
        total = req.session.grantTotal;
      } else {
        total = req.session.amounttopay;
      }
      var options = {
        amount: total * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
      };
      const order = await instance.orders.create(options);
      return res.json({ success: true, order, messsge: "@@@@@" });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Error in creating order");
    }
  },

  getVerifyPayment: async (req, res) => {
    let hmac = crypto.createHmac("sha256", "78VyQUXJoJIKCpG0CJzyykq1");
    hmac.update(
      req.body.payment.razorpay_order_id +
        "|" +
        req.body.payment.razorpay_payment_id
    );
    hmac = hmac.digest("hex");
    const orderId = req.body.payment.razorpay_order_id;
    const orderID = req.session.orderId;
  
    const updateOrderDocument = await Order.findByIdAndUpdate(orderID, {
        op: "Placed",
        
    });
    if (hmac === req.body.payment.razorpay_signature) {
      res.json({ success: true });
    } else {
      res.json({ failure: true });
    }
  },

  showWalletPage: async (req, res) => {
    try {
      const categories = await categoryModel.find();
      const userEmail = req.session.email;

      const user = await Users.findOne({ email: userEmail });

   

     
      
      const wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        return res.status(404).send("Wallet not found for the user");
      }

     

      const page = parseInt(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;

      const totalTransactions = wallet.transactions.length;
      const totalPages = Math.ceil(totalTransactions / limit);



      const transactions = await Wallet.aggregate([
        { $match: { userId: wallet._id } }, 
        { $unwind: '$transactions' }, 
        { $sort: { 'transactions.date': -1 } }, 
        { $skip: skip }, 
        { $limit: limit } 
    ]);

     

      if (user) {
        res.render("user/wallet", {
          user,
          categories,
          wallet,
          transactions,
          totalPages, currentPage: page 
        
        });
        req.session.email = userEmail;
      } else {
        res.status(404).send("User not found");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
