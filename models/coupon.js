const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName: 
  {  type: String,
   
     },
     couponCode:{
    type: String
   }  ,
  discountPercentage: { 
    type: Number,
    
    },
    maximumDiscountAmount: {
      type: Number
    },
    minimumPurchaseAmount:{
      type:Number
    },
  startDate:{
      type:Date,
      required:true,
    },
  expirationDate: {
     type: Date,
     required:true,
   
     },
//      users: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Users', 
//   }],
  

});
couponSchema.index({ expirationDate: 1 }, { expireAfterSeconds: 0 });


const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;