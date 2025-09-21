const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
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
            },
            status: {
                type: String,
                default: "Active",
                enum: ["Active", "Cancelled", "Returned"]
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

},{ timestamps: true });


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
