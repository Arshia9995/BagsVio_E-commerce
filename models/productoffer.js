const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    productName: {
        type: String
        // required: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value >= 0 && value <= 100; // Discount percentage should be between 0 and 100
            },
            message: 'Discount percentage must be between 0 and 100.'
        }
    },
    // startDate: {
    //     type: Date,
    //     required: true
    // },
    // endDate: {
    //     type: Date,
    //     required: true
    // },
    // isActive: {
    //     type: Boolean,
    //     default: true
    // }
});

const ProductOffer = mongoose.model('ProductOffer', productOfferSchema);
module.exports = ProductOffer;
