const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    categoryName: {
        type: String,
        required: true
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
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CategoryOffer = mongoose.model('CategoryOffer', categoryOfferSchema);
module.exports = CategoryOffer;
