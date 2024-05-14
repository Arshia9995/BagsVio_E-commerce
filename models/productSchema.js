const mongoose = require('mongoose');
const {Schema,ObjectId}=mongoose

const productSchema = new mongoose.Schema({
   

  ProductName:{
    type:String,
   
    uppercase:true
},
Price:{
type: Number,

validate: {
validator: function (value) {
  return value > 0; 
},
message: 'Price must be a positive number.'
}

},
Description: {
    type: String,
   
  },
  BrandName: {
    type: Schema.Types.ObjectId,
   
    ref:'brand'
  },
  images:{
   type:Array,
 
  },

  AvailableQuantity: {
    type: Number,
    validate: {
      validator: function(value) {
        return value >= 0; 
      },
      message: "Quantity Can't be less than 0"
    }
},      
Category:{
    type: Schema.Types.ObjectId,
   
    ref: 'category'
},
DiscountAmount:{
    type:Number,
    validate: {
        validator: function (value) {
          return value >= 0 && value <= this.Price; 
        },
        message: 'Discount amount must be a positive number and less than the Price.'
      }
},
Status: {
    type: String,
   
  },
  Variation: {
    type: String,
  },
  ProductType: {
    type: String,
  },
  UpdatedOn: {
    type: String
  },
  Display: {
    type: String,
    required: true
  },

  deletedAt: {
    type: Date
  },
  isBlocked:{
    type:Boolean,
    default:false
},
isNewArrival:{
  default:false,
  type:Boolean
},
isNewTrends:{
  default:false,
  type:Boolean
},
productoffer:{
  type:Number

},
productofferPrice:{
  type:Number
},
reviews: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Review'
}]





});


const Product = mongoose.model('Product', productSchema);
module.exports = Product;









