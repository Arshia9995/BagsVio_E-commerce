const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    
  },
  rating: {
    type: Number,
   
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
   
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
