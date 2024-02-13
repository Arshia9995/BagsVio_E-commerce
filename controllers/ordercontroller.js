const productModel = require('../models/productSchema');
const categoryModel = require('../models/categorySchema');
// const { uploadSingle, uploadMultiple }  = require('../util/multer');
const Users = require('../models/user');
const Order=require('../models/order')
const Cart=require("../models/cartSchema")
const Address=require("../models/address")


module.exports = {

placeOrder: async (req, res) => {
    try {
        const { userId } = req.session;
        console.log('selected id from',req.body);
        const { selectedAddress, paymentMethod } = req.session;
        console.log("Selected address ID:", selectedAddress); // Ensure selectedAddress contains the ID

        // Fetch user's cart
        const userCart = await Cart.findOne({ userId }).populate('items.productId');
        console.log('user cart ',userCart)
        let totalPrice = 0;
        userCart.items.forEach((item) => {
            console.log("item",item)
            totalPrice += item.productId.Price * item.quantity;
        });
        

        // Fetch the selected address details using populate
        const addressDetails = await Address.findOne({ userId: req.session.userId, 'addresses._id': selectedAddress }, { 'addresses.$': 1 });


        console.log(addressDetails,"jjjjjjjjjjjjjjjjjjjj")
        const productsToUpdate = userCart.items.map((item) => ({
            productId: item.productId._id,
            quantity: item.quantity,
            price:item.productId.Price
        }));

        console.log('>>>>>>>>',totalPrice)

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
            
        });

        for (const product of productsToUpdate) {
            const existingProduct = await productModel.findById(product.productId);

            if (existingProduct) {
                existingProduct.stock -= product.quantity;
                await existingProduct.save();
            }
        }


        await newOrder.save();
        console.log("ddddddd now my order details" ,newOrder)

        userCart.items = [];
        await userCart.save();

        delete req.session.selectedAddress;
        delete req.session.paymentMethod;

        res.redirect('/paymentsuccess');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
},
showOrdersPage: async (req, res) => {
    const { userId } = req.session;
    const categories = await categoryModel.find();
    console.log(userId, "userid.........");
    try {
        const order = await Order.find({ userId, status: { $ne: 'Cancelled' } })
            .populate('products.productId')
            .sort({ orderDate: -1 }); // Sort orders by orderDate in descending order
        res.render("user/orders", { categories, order });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
},
showOrderDetailsPage: async (req, res) => {
    const { userId } = req.session;
    const { orderId, productId } = req.params;
    console.log('jproducut id ',productId);

    
  
    try {
        const user=await Users.findOne({_id:userId})
        console.log('now my user',user);
      const order = await Order.findOne({ _id: orderId, userId }).populate('products.productId');
      console.log('shipping address',order.shippingAddress);
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
  cancelOrder :async (req, res) => {
    const { orderId } = req.params;
    console.log(orderId,"id.............")
    console.log(typeof(orderId))
    console.log("cancelled1111111...........")
    try {
     
      const canceledOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });

  console.log(canceledOrder,"canceled order........")
      if (!canceledOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      console.log("cancelled...........")
      res.status(200).json({ message: 'Order cancelled successfully' });
     
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  },



     
  adminOrderPage:async(req,res)=>{
    try {
      const orders = await Order.find().populate('products.productId').populate('userId')
      // console.log(orders,'..order')
      res.render("admin/order",{orders})
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: "Internal server error" })
    }
       },

       adminOrderViewPage: async (req, res) => {
        const orderId = req.params.orderId;
    
        try {
            // Fetch the specific order details based on the orderId
            const orders = await Order.findById(orderId).populate('products.productId');
    
            if (!orders) {
                return res.status(404).json({ error: "Order not found" });
            }
    
            res.render("admin/orderview", { orders }); // Render the admin order view with order details
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    },
    updateOrderStatus:async(req,res)=>{
        const orderId = req.params.orderId;
        const newStatus = req.body.status; 
        // const newPaymentStatus =req.body.paymentStatus
        //  console.log(orderId)
        console.log("Received orderId:", orderId);
        console.log("Received newStatus:", newStatus);
        try {
     
            const orders = await Order.findByIdAndUpdate(orderId, { status: newStatus}, { new: true });
    
            if (!orders) {
                return res.status(404).json({ error: "Order not found" });
            }
    
            // if (order.paymentMethod === 'Cash On Delivery') {
            //     await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Pending' });
            // }

           
        // Update payment status based on the new order status
        if (newStatus === "Delivered") {
          orders.paymentStatus = "Paid";
         } else if (newStatus === "Pending" || newStatus === "Processing" || newStatus === "Shipped") {
          orders.paymentStatus = "Pending";
         }

        // Save the updated order
        await orders.save();
    
     


        res.json({ 
          order: orders,
          paymentStatus: orders.paymentStatus // Include the paymentStatus in the response
      });
    
            // res.redirect('/admin/order'); 
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: "Internal server error" });
        }
    }














}