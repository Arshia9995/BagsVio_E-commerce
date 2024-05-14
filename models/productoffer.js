const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
    productName: {
        type: String
      
    },
    discountPercentage: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return value >= 0 && value <= 100; 
            },
            message: 'Discount percentage must be between 0 and 100.'
        }
    },
 
});

const ProductOffer = mongoose.model('ProductOffer', productOfferSchema);
module.exports = ProductOffer;
