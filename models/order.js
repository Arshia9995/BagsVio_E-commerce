const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
       
    },
    products: [
        {
            productId:
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                
            },
            quantity:
            {
                type: Number,
             
            },
            price:
            {
                type: Number
            }

        }
    ],
    totalPrice:
    {
        type: Number,
       
    },

    shippingAddress: {
        name: { type: String, },
        addressline: { type: String, },
        street: { type: String, },
        city: { type: String, },
        state: { type: String, },
        mobile: { type: String, },
        pincode: { type: String, }
    },
    
    orderDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String
    },
    paymentStatus: {
        type: String,
        default: "pending"
    },
    status: {
        type: String,
        default: "Pending"
    },
    discount: {
        type:Number
    },
    op:{
        type:String,
    }

});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
