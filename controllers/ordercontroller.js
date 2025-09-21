const productModel = require("../models/productSchema");
const categoryModel = require("../models/categorySchema");

const Users = require("../models/user");
const Order = require("../models/order");
const Cart = require("../models/cartSchema");
const Address = require("../models/address");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Wallet = require("../models/wallet");
const coupon = require("../models/coupon");
const Coupon = require("../models/coupon");
const generateOrderId = require("../utility/generateOrderId");
const { getCategoryOffersForProducts } = require('../utility/categoryOfferHelper');

var instance = new Razorpay({
  key_id: "rzp_test_yOdXB6QYxSIZDa",
  key_secret: "4tAiYWi2wV8nlOQcYz30UJ9C",
});

module.exports = {
  placeOrder: async (req, res) => {
    try {
      const { userId } = req.session;

      const { selectedAddress, paymentMethod } = req.session;

      const discount = req.session.discount;
      const couponCode = req.session.couponCode;

      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );

      // Get category offers for cart items
      if (userCart && userCart.items && userCart.items.length > 0) {
        const cartProducts = userCart.items.map(item => item.productId).filter(product => product);
        const productsWithOffers = await getCategoryOffersForProducts(cartProducts);
        
        // Update cart items with offer information
        userCart.items.forEach(item => {
          const productWithOffer = productsWithOffers.find(p => p._id.toString() === item.productId._id.toString());
          if (productWithOffer) {
            // Merge offer information into the existing product object
            item.productId.categoryOffer = productWithOffer.categoryOffer;
            item.productId.discountedPrice = productWithOffer.discountedPrice;
            item.productId.hasCategoryOffer = productWithOffer.hasCategoryOffer;
          } else {
            // Ensure properties exist even if no offer
            item.productId.categoryOffer = null;
            item.productId.discountedPrice = item.productId.Price;
            item.productId.hasCategoryOffer = false;
          }
        });
      }

      let totalPrice = 0;
      userCart.items.forEach((item) => {
        let itemPrice = item.productId.Price;
        if (item.productId && item.productId.hasCategoryOffer) {
            itemPrice = item.productId.discountedPrice;
        }
        totalPrice += itemPrice * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);

      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );

      const productsToUpdate = userCart.items.map((item) => {
        let itemPrice = item.productId.Price;
        if (item.productId && item.productId.hasCategoryOffer) {
            itemPrice = item.productId.discountedPrice;
        }
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          price: itemPrice,
          status: "Active",
        };
      });

      req.session.grantTotal = totalPrice;
      req.session.amounttopay = totalPrice;

      const orderId = await generateOrderId();

      if (paymentMethod === "Cash On Delivery") {
        const newOrder = new Order({
          orderId: orderId,
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

        if (couponCode) {
          const coupon = await Coupon.findOne({ couponCode: couponCode });
          console.log(userId, "uuuuuuuu");
          console.log(coupon, "ccccccccccc");

          if (coupon) {
            if (!coupon.users.includes(userId._id)) {
              coupon.users.push(userId._id);
              await coupon.save();
            }
          }
        }

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
          orderId: orderId,
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

        if (couponCode) {
          const coupon = await Coupon.findOne({ couponCode: couponCode });
          console.log(userId, "uuuuuuuu");
          console.log(coupon, "ccccccccccc");

          if (coupon) {
            if (!coupon.users.includes(userId._id)) {
              coupon.users.push(userId._id);
              await coupon.save();
            }
          }
        }
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
          transactionType: "debit",
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

      const order = await Order.find({
        userId,
        $or: [
          { paymentMethod: { $ne: "Online Payment" } },
          { op: { $ne: "Pending" } },
        ],
      })
        .populate("products.productId")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit);

      res.render("user/orders", {
        categories,
        order,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  findOrder: async (req, res) => {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    req.session.paymentMethod = "Online Payment";
    res.json(order);
  },

  showFailedPayments: async (req, res) => {
    const { userId } = req.session;
    const categories = await categoryModel.find();

    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    try {
      const totalOrders = await Order.countDocuments({ userId });
      const totalPages = Math.ceil(totalOrders / limit);

      const order = await Order.find({ userId, op: "Pending" })
        .populate("products.productId")
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit);
      console.log(order, "oooooooooooo");

      res.render("user/failedpayments", {
        categories,
        order,
        totalPages,
        currentPage: page,
      });
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
        // Initialize product status for existing orders that don't have it
        let needsUpdate = false;
        for (let i = 0; i < order.products.length; i++) {
          if (!order.products[i].status) {
            order.products[i].status = "Active";
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await order.save();
          console.log("Updated order with product statuses");
        }

        res.render("user/orderdetails", { order, categories });
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
    const { totalPrice } = req.body;
  

    try {
      const canceledOrder = await Order.findByIdAndUpdate(orderId, {
        status: "Cancelled",
        paymentStatus: "Cancelled",
      }).populate("products.productId");

      if (!canceledOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update all products to cancelled status
      for (let i = 0; i < canceledOrder.products.length; i++) {
        canceledOrder.products[i].status = "Cancelled";
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

      if (
        req.body.paymentMethod == "Online Payment" ||
        req.body.paymentMethod == "Wallet"
      ) {
        const userWallet = await Wallet.findOne({ userId: userId });

        if (!userWallet) {
          return res
            .status(400)
            .json({ error: "Wallet not found for the user" });
        }

        userWallet.balance += Number(totalPrice);
        const refundTransaction = {
          transactionType: "credit",
          amount: Number(totalPrice),
          date: new Date(),
          from: "Refund for cancel",
          orderId: canceledOrder.orderId,
        };

        userWallet.transactions.push(refundTransaction);
        await userWallet.save();
      }

      await canceledOrder.save();
      
      res
        .status(200)
        .json({ success: true, message: "Order cancelled successfully" });
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

      // Update all products to returned status
      for (let i = 0; i < returnedOrder.products.length; i++) {
        returnedOrder.products[i].status = "Returned";
      }

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
        orderId: returnedOrder.orderId,
      };
      userWallet.transactions.push(transaction);
      await userWallet.save();

      await returnedOrder.save();

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

      const orders = await Order.find({
        $or: [
          { op: "Placed" },
          { paymentMethod: { $in: ["Cash On Delivery", "Wallet"] } }
        ]
      })
        .sort({ createdAt: 1 })
        .populate("products.productId")
        .populate("userId")
        .skip((page - 1) * perPage)
        .limit(perPage);

      const ordersCount = await Order.countDocuments();
      const totalPages = Math.ceil(ordersCount / perPage);

      res.render("admin/order", {
        orders,
        title: "Admin Orders Page",
        currentPage: page,
        totalPages,
        perPage,
      });
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

      res.render("admin/orderview", { orders, title: "Admin OrderView" });
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
      const couponCode = req.session.couponCode;

      const { selectedAddress, paymentMethod } = req.session;
    

      const discount = req.session.discount;

      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );

      // Get category offers for cart items
      if (userCart && userCart.items && userCart.items.length > 0) {
        const cartProducts = userCart.items.map(item => item.productId).filter(product => product);
        const productsWithOffers = await getCategoryOffersForProducts(cartProducts);
        
        // Update cart items with offer information
        userCart.items.forEach(item => {
          const productWithOffer = productsWithOffers.find(p => p._id.toString() === item.productId._id.toString());
          if (productWithOffer) {
            // Merge offer information into the existing product object
            item.productId.categoryOffer = productWithOffer.categoryOffer;
            item.productId.discountedPrice = productWithOffer.discountedPrice;
            item.productId.hasCategoryOffer = productWithOffer.hasCategoryOffer;
          } else {
            // Ensure properties exist even if no offer
            item.productId.categoryOffer = null;
            item.productId.discountedPrice = item.productId.Price;
            item.productId.hasCategoryOffer = false;
          }
        });
      }

      let totalPrice = 0;
      userCart.items.forEach((item) => {
        let itemPrice = item.productId.Price;
        if (item.productId && item.productId.hasCategoryOffer) {
            itemPrice = item.productId.discountedPrice;
        }
        totalPrice += itemPrice * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);

      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );
     
      const productsToUpdate = userCart.items.map((item) => {
        let itemPrice = item.productId.Price;
        if (item.productId && item.productId.hasCategoryOffer) {
            itemPrice = item.productId.discountedPrice;
        }
        return {
          productId: item.productId._id,
          quantity: item.quantity,
          price: itemPrice,
          status: "Active",
        };
      });

      req.session.grantTotal = totalPrice;
      req.session.amounttopay = totalPrice;

      const orderId = await generateOrderId();
      const newOrder = new Order({
        orderId: orderId,
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
        paymentStatus: "Pending",
        op: "Pending",
        discount: discount,
      });

      for (const product of productsToUpdate) {
        req.session.productId = product.productId;
        req.session.quantity = product.quantity;
      }

      await newOrder.save();

      if (couponCode) {
        const coupon = await Coupon.findOne({ couponCode: couponCode });
      

        if (coupon) {
          if (!coupon.users.includes(userId._id)) {
            coupon.users.push(userId._id);
            await coupon.save();
          }
        }
      }

   
      req.session.orderId = newOrder._id;
      

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

    // const updateOrderDocument = await Order.findByIdAndUpdate(orderID, {
    //   op: "Placed",
    // });
    if (hmac === req.body.payment.razorpay_signature) {
      res.json({ success: true });
    } else {
      res.json({ failure: true });
    }
  },

  showWalletPage: async (req, res) => {
    try {
      const userEmail = req.session.email;
      const page = parseInt(req.query.page) || 1;
      const limit = 3;
      const skip = (page - 1) * limit;
      const user = await Users.findOne({ email: userEmail });
      const wallet = await Wallet.findOne({ userId: user._id })
    

      const totalTransactions = wallet?.transactions?.length;
      const totalPages = Math.ceil(totalTransactions / limit);
      const categories = await categoryModel.find();



      if (!wallet) {
        return res.render("user/wallet", {
          user,
          wallet: {},
          categories,
          totalPages: 0,
          currentPage: 0,
        });
      }


      const transactions = await Wallet.aggregate([
        { $match: { userId: wallet.userId } }, 
        { $unwind: "$transactions" },
        { $sort: { "transactions.date": 1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
     

      if (user) {
        res.render("user/wallet", {
          user,
          categories,
          wallet,
          transactions,
          totalPages,
          currentPage: page,
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

  createOrder: async (req, res) => {
    const { amount } = req.body;
  
    
    const options = {
      amount: Number(amount) * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
  
    try {
      const order = await instance.orders.create(options); 
      res.status(200).json(order);
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
},


    
    
   
   
walletverifyPayment: async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
 
  const userId = req.session.userId;
  
  let hmac = crypto.createHmac("sha256", "78VyQUXJoJIKCpG0CJzyykq1");
  hmac.update(
    razorpay_order_id+
    "|" +
    razorpay_payment_id
  );
  hmac = hmac.digest("hex");

  let wallet = await Wallet.findOne({ userId });
          if (!wallet) {
              wallet = new Wallet({ userId, balance: 0 });
          }

          const transaction = {
              transactionType: 'credit',
              amount: 100, // Amount to be credited
              from: 'Top-Up',
              paymentId: razorpay_order_id
          };

          wallet.balance += transaction.amount;
          wallet.transactions.push(transaction);
          await wallet.save();

          res.status(200).json({ success: true, newBalance: wallet.balance });
},

cancelIndividualProduct: async (req, res) => {
  const { orderId, productId } = req.params;
  const userId = req.session.userId._id;

  try {
    const order = await Order.findOne({ _id: orderId, userId }).populate("products.productId");
    console.log(order, "order");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("order found");

    // Find the specific product in the order
    const productIndex = order.products.findIndex(
      item => item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    const product = order.products[productIndex];
    console.log(product, "product");

    // Initialize status if it doesn't exist (for existing orders)
    if (!product.status) {
      product.status = "Active";
    }

    // Check if product can be cancelled (only if order is pending or processing)
    if (order.status !== "Pending" && order.status !== "Processing") {
      return res.status(400).json({ message: "Cannot cancel product from this order status" });
    }

    // Check if product is already cancelled
    if (product.status === "Cancelled") {
      return res.status(400).json({ message: "Product is already cancelled" });
    }

    // Update product status to cancelled
    order.products[productIndex].status = "Cancelled";
    
    // Restore product quantity
    const productToUpdate = await productModel.findById(productId);
    if (productToUpdate) {
      productToUpdate.AvailableQuantity += product.quantity;
      await productToUpdate.save();
    }
    console.log(productToUpdate, "productToUpdate");

    // Calculate refund amount for this product
    const refundAmount = product.price * product.quantity;

    // Handle refund based on payment method
    if (order.paymentMethod === "Online Payment" || order.paymentMethod === "Wallet") {
      const userWallet = await Wallet.findOne({ userId });
      console.log(userWallet, "userWallet");
      
      if (!userWallet) {
        return res.status(400).json({ error: "Wallet not found for the user" });
      }

      userWallet.balance += refundAmount;
      
      const refundTransaction = {
        transactionType: "credit",
        amount: refundAmount,
        date: new Date(),
        from: "Refund for product cancellation",
        orderId: order.orderId,
        productId: productId
      };

      userWallet.transactions.push(refundTransaction);
      await userWallet.save();
      console.log(userWallet, "userWallet");
    }

    // Check if all products are cancelled, then update order status
    const activeProducts = order.products.filter(p => p.status === "Active");
    if (activeProducts.length === 0) {
      order.status = "Cancelled";
      order.paymentStatus = "Cancelled";
    }

    await order.save();
    console.log("order saved");

    res.status(200).json({ 
      success: true, 
      message: "Product cancelled successfully",
      refundAmount: refundAmount
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
},

returnIndividualProduct: async (req, res) => {
  const { orderId, productId } = req.params;
  const userId = req.session.userId._id;

  try {
    const order = await Order.findOne({ _id: orderId, userId }).populate("products.productId");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Find the specific product in the order
    const productIndex = order.products.findIndex(
      item => item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in order" });
    }

    const product = order.products[productIndex];

    // Initialize status if it doesn't exist (for existing orders)
    if (!product.status) {
      product.status = "Active";
    }

    // Check if product can be returned (only if order is delivered)
    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "Can only return products from delivered orders" });
    }

    // Check if product is already returned
    if (product.status === "Returned") {
      return res.status(400).json({ message: "Product is already returned" });
    }

    // Update product status to returned
    order.products[productIndex].status = "Returned";
    
    // Restore product quantity
    const productToUpdate = await productModel.findById(productId);
    if (productToUpdate) {
      productToUpdate.AvailableQuantity += product.quantity;
      await productToUpdate.save();
    }

    // Calculate refund amount for this product
    const refundAmount = product.price * product.quantity;

    // Add refund to wallet
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ error: "User's wallet not found" });
    }

    userWallet.balance += refundAmount;
    
    const refundTransaction = {
      transactionType: "credit",
      amount: refundAmount,
      date: new Date(),
      from: "Refund for product return",
      orderId: order.orderId,
      productId: productId
    };

    userWallet.transactions.push(refundTransaction);
    await userWallet.save();

    // Check if all products are returned, then update order status
    const activeProducts = order.products.filter(p => p.status === "Active");
    if (activeProducts.length === 0) {
      order.status = "Returned";
      order.paymentStatus = "Refunded";
    }

    await order.save();

    res.status(200).json({ 
      success: true, 
      message: "Product returned successfully",
      refundAmount: refundAmount
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
  
};
