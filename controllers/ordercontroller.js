const productModel = require("../models/productSchema");
const categoryModel = require("../models/categorySchema");
// const { uploadSingle, uploadMultiple }  = require('../util/multer');
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
      console.log("selected id from", req.body);
      const { selectedAddress, paymentMethod } = req.session;
      console.log(paymentMethod);
      console.log("Selected address ID:", selectedAddress); // Ensure selectedAddress contains the ID
      const discount = req.session.discount;
      // Fetch user's cart
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
      console.log("user cart ", userCart);
      let totalPrice = 0;
      userCart.items.forEach((item) => {
        console.log("item", item);
        totalPrice += item.productId.Price * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);
      

      // Fetch the selected address details using populate
      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );

      const productsToUpdate = userCart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.Price,
      }));

      console.log(">>>>>>>>", totalPrice);
      req.session.grantTotal = totalPrice;
      req.session.amounttopay = totalPrice;

      // Fetch user's wallet

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
          console.log(existingProduct, "existinggggggggggggggggg");
          if (existingProduct) {
            existingProduct.AvailableQuantity -= product.quantity;
            await existingProduct.save();
          }
        }

        await newOrder.save();
        console.log("ddddddd now my order details", newOrder);

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
        console.log('this is the user wallet',userWallet)

        if (!userWallet) {
          return res
            .status(400)
            .json({ error: "Wallet not found for the user" });
        }
        // Deduct total order amount from user's wallet balance
        userWallet.balance -= totalPrice;

        // Create order and capture its ID
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
        const orderId = newOrder._id; // Capture the order ID

        // Create transaction record
        const transaction = {
          transactionType:'debit',
          amount: totalPrice,
          date: new Date(),
          from: "Wallet",
          orderId: orderId, // Assign the order ID here
        };
        console.log('this is the transaction',transaction)

        // Add transaction to user's wallet
        userWallet.transactions.push(transaction);
        console.log('transacction added to wallet')

        // Save updated wallet
        await userWallet.save();
        console.log('wallet saved')
        return res.redirect("/paymentsuccess");
      } else {
        // Handle insufficient balance or non-wallet payment method
        // For example, redirect to a payment gateway or show an error message
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
    console.log(userId, "userid.........");
    try {
      const order = await Order.find({ userId })
        .populate("products.productId")
        .sort({ orderDate: -1 });
      res.render("user/orders", { categories, order });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  showOrderDetailsPage: async (req, res) => {
    const { userId } = req.session;
    const { orderId, productId } = req.params;
    console.log("producut id ", productId);
    const discount = req.session.discount;

    try {
      const user = await Users.findOne({ _id: userId });
      console.log("now my user", user);
      const order = await Order.findOne({ _id: orderId, userId }).populate(
        "products.productId"
      );
      console.log("shipping address", order.shippingAddress);
      //   console.log('order now',order);

      // Check if the order exists
      if (order) {
        res.render("user/orderdetails", { order });
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
    console.log(orderId, "id.............");
    console.log(typeof orderId);
    console.log("cancelled1111111...........");

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
          // Retrieve product information for the item
          const productId = item.productId._id;
          console.log(
            "??????????????????????",
            productId,
            "???????????????????????"
          );
          const canceledQuantity = item.quantity;

          // Find the corresponding product and update its stock quantity
          const product = await productModel.findById(productId);
          if (product) {
            // Increase the stock quantity by the canceled quantity
            product.AvailableQuantity += canceledQuantity;
            await product.save();
          }
        }
        const userWallet = await Wallet.findOne({ userId: userId });
        console.log(userWallet, "userWallet");

        if (!userWallet) {
          return res
            .status(400)
            .json({ error: "Wallet not found for the user" });
        }
        let totalRefundAmount = 0;
        canceledOrder.products.forEach((item) => {
          totalRefundAmount += item.price * item.quantity;
        });
        userWallet.balance += totalRefundAmount;
        const refundTransaction = {
          transactionType: "credit",
          amount: totalRefundAmount,
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
    // try {
    //   console.log(req.body,'=-===========')
    //   const canceledOrder = await Order.findByIdAndUpdate(orderId, {
    //     status: "Cancelled",
    //     paymentStatus: "Cancelled",
    //   }).populate("products.productId");

    //   console.log(canceledOrder, "canceled order........");
    //   if (!canceledOrder) {
    //     return res.status(404).json({ message: "Order not found" });
    //   }

    //   // Iterate through each item in the canceled order
    //   for (const item of canceledOrder.products) {
    //     // Retrieve product information for the item
    //     const productId = item.productId._id ;
    //     console.log('??????????????????????',productId,'???????????????????????')
    //     const canceledQuantity = item.quantity;

    //     // Find the corresponding product and update its stock quantity
    //     const product = await productModel.findById(productId);
    //     if (product) {
    //       // Increase the stock quantity by the canceled quantity
    //       product.AvailableQuantity += canceledQuantity;
    //       await product.save();
    //     }
    //   }
    //   console.log('1');

    //   // If the payment method was 'Wallet', refund the amount to the user's wallet
    //   // if (canceledOrder.paymentMethod === 'Wallet') {
    //     const userId = canceledOrder.userId;

    //     // Fetch user's wallet
    //     const userWallet = await Wallet.findOne({ userId:userId });

    //     if (!userWallet) {
    //         return res.status(400).json({ error: 'Wallet not found for the user' });
    //     }
    //     console.log('2');
    //      // Calculate the total amount to be refunded
    //      let totalRefundAmount = 0;
    //      canceledOrder.products.forEach(item => {
    //          totalRefundAmount += item.price * item.quantity;
    //      });
    //      totalPrice=totalPrice-(discount||0)

    //       // Add funds back to the user's wallet
    //       userWallet.balance += totalRefundAmount;

    //        // Create a transaction record for the refund
    //        const refundTransaction = {
    //         transactionType: 'credit',
    //         amount: totalRefundAmount,
    //         date: new Date(),
    //         from: 'Refund for cancel',
    //         orderId: orderId,
    //     };
    //     console.log('3');
    //      // Add the refund transaction to the user's wallet transactions
    //      userWallet.transactions.push(refundTransaction)

    //      // Save the updated wallet balance and transaction record
    //      await userWallet.save();
    // //  }

    //   // Update the status of the canceled order
    //   // const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });

    //   // res.status(200).json({ message: 'Order cancelled successfully' });
    //   console.log("cancelled...........");
    //   console.log('set???????????????')
    //   res.status(200).json({success:true, message: "Order cancelled successfully" });
    // } catch (err) {
    //   return res.status(500).json({ error: "Internal server error" });
    // }
  },
  returnOrder: async (req, res) => {
    const { orderId } = req.params;
    console.log(orderId, "id.............");
    console.log(typeof orderId);

    try {
      const returnedOrder = await Order.findByIdAndUpdate(orderId, {
        status: "Returned",
        paymentStatus: "Refunded",
      }).populate("products.productId");

      console.log(returnedOrder, "returned order........");
      if (!returnedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update the status of the returned order
      returnedOrder.status = "Returned";
      returnedOrder.paymentStatus = "Refunded";
      await returnedOrder.save();

      // Iterate through each item in the canceled order
      for (const item of returnedOrder.products) {
        // Retrieve product information for the item
        const productId = item.productId;
        const returnedQuantity = item.quantity;

        // Find the corresponding product and update its stock quantity
        const product = await productModel.findById(productId);
        if (product) {
          // Increase the stock quantity by the canceled quantity
          product.AvailableQuantity += returnedQuantity;
          await product.save();
        }
      }

      // Calculate refund amount
      let refundAmount = 0;
      for (const item of returnedOrder.products) {
        refundAmount += item.price * item.quantity;
      }

      // Retrieve user's wallet and update the balance
      const userWallet = await Wallet.findOne({ userId: returnedOrder.userId });
      if (!userWallet) {
        return res.status(404).json({ error: "User's wallet not found" });
      }
      userWallet.balance += refundAmount;
      await userWallet.save();

      // Record transaction
      const transaction = {
        transactionType: "credit",
        amount: refundAmount,
        from: `Refund for return `,
        orderId: returnedOrder._id,
      };
      userWallet.transactions.push(transaction);
      await userWallet.save();

      // Update the status of the canceled order
      // const updatedOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });

      // res.status(200).json({ message: 'Order cancelled successfully' });
      console.log("returned...........");
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
      const orders = await Order.find()
        .populate("products.productId")
        .populate("userId");
      // console.log(orders,'..order')
      res.render("admin/order", { orders });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  adminOrderViewPage: async (req, res) => {
    const orderId = req.params.orderId;

    try {
      // Fetch the specific order details based on the orderId
      const orders = await Order.findById(orderId).populate(
        "products.productId"
      );

      if (!orders) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.render("admin/orderview", { orders }); // Render the admin order view with order details
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  updateOrderStatus: async (req, res) => {
    const orderId = req.params.orderId;
    const newStatus = req.body.status;
    // const newPaymentStatus =req.body.paymentStatus
    //  console.log(orderId)
    console.log("Received orderId:", orderId);
    console.log("Received newStatus:", newStatus);
    try {
      const orders = await Order.findByIdAndUpdate(
        orderId,
        { status: newStatus },
        { new: true }
      );

      if (!orders) {
        return res.status(404).json({ error: "Order not found" });
      }

      // if (order.paymentMethod === 'Cash On Delivery') {
      //     await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Pending' });
      // }

      // Update payment status based on the new order status
      if (newStatus === "Delivered") {
        orders.paymentStatus = "Paid";
      } else if (
        newStatus === "Pending" ||
        newStatus === "Processing" ||
        newStatus === "Shipped"
      ) {
        orders.paymentStatus = "Pending";
      }

      // Save the updated order
      await orders.save();

      res.json({
        order: orders,
        paymentStatus: orders.paymentStatus, // Include the paymentStatus in the response
      });

      // res.redirect('/admin/order');
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  makePayment: async (req, res) => {
    try {
      const { userId } = req.session;
      console.log("selected id from", req.body);
      const { selectedAddress, paymentMethod } = req.session;
      console.log("Selected address ID:", selectedAddress); // Ensure selectedAddress contains the ID
      const discount = req.session.discount;
      // Fetch user's cart
      const userCart = await Cart.findOne({ userId }).populate(
        "items.productId"
      );
      console.log("user cart ", userCart);
      let totalPrice = 0;
      userCart.items.forEach((item) => {
        console.log("item", item);
        totalPrice += item.productId.Price * item.quantity;
      });
      totalPrice = totalPrice - (discount || 0);
      // Fetch the selected address details using populate
      const addressDetails = await Address.findOne(
        { userId: req.session.userId, "addresses._id": selectedAddress },
        { "addresses.$": 1 }
      );

      const productsToUpdate = userCart.items.map((item) => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.Price,
      }));

      console.log(">>>>>>>>", totalPrice);
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
        discount: discount,
      });

      for (const product of productsToUpdate) {
        const existingProduct = await productModel.findById(product.productId);
        console.log(existingProduct, "existinggggggggggggggggg");
        if (existingProduct) {
          existingProduct.AvailableQuantity -= product.quantity;
          await existingProduct.save();
        }
      }

      await newOrder.save();
      console.log("ddddddd now my order details", newOrder);

      userCart.items = [];
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

    if (hmac === req.body.payment.razorpay_signature) {
      const orderId = req.body.order.receipt;
      const orderID = req.body.orderId;
      // const updateOrderDocument = await order.findByIdAndUpdate(orderID, {
      //     PaymentStatus: "Paid",
      //     paymentMethod: "Online",
      // });
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

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;

      console.log(user);
      // Fetch user's wallet
      const wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        return res.status(404).send("Wallet not found for the user");
      }

      const totalTransactions = wallet.transactions.length;
      const totalPages = Math.ceil(totalTransactions / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;

      const transactions = wallet.transactions.slice(startIndex, endIndex);
      console.log("startIndex:", startIndex);
      console.log("endIndex:", endIndex);

      if (user) {
        res.render("user/wallet", {
          user,
          categories,
          wallet,
          transactions,
          totalPages,
          currentPage: page,
          limit,
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
