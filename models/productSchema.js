const mongoose = require('mongoose');
const {Schema,ObjectId}=mongoose

const productSchema = new mongoose.Schema({
   

  ProductName:{
    type:String,
    // required: true,
    uppercase:true
},
Price:{
type: Number,
// required: true,
validate: {
validator: function (value) {
  return value > 0; // Ensuring Price is a positive number
},
message: 'Price must be a positive number.'
}

},
Description: {
    type: String,
    // required: true,
  },
  BrandName: {
    type: Schema.Types.ObjectId,
    // required:true,
    ref:'brand'
  },
  images:{
   type:Array,
  //  required:true,
  },
  AvailableQuantity: {
    type: Number,
    validate: {
      validator: function(value) {
        return value >= 0; // Validates that Quantity is greater than 0
      },
      message: "Quantity Can't be less than 0"
    }
},      
Category:{
    type: Schema.Types.ObjectId,
    // required:true,
    ref: 'category'
},
DiscountAmount:{
    type:Number,
    validate: {
        validator: function (value) {
          return value >= 0 && value <= this.Price; // Ensuring DiscountAmount is positive and less than or equal to Price
        },
        message: 'Discount amount must be a positive number and less than the Price.'
      }
},
Status: {
    type: String,
    // required: true,
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




});


const Product = mongoose.model('Product', productSchema);
module.exports = Product;










 // productName: {
    //     type: String,
    //     required: true,
    //     uppercase:true
    //   },
      
     
    //   category:{
    //     type:String
    //   },
    //   // brand: {
    //   //   type: Schema.Types.ObjectId,
    //   //   required: true,
    //   //   ref: 'brand'
    //   // }, 
    // photos: {
    //     type: Array,
    //     required: true,
    //   },
    //   stock: {
    //     type: Number,
    //     required: true,
    //   },
    //   brand:{
    //     type:String,
        
    //   },
    //   price: {
    //     type: Number,
    //     required: true,
    //   },
    //   // category: {
    //   //   type: Schema.Types.ObjectId,
    //   //   required: true,
    //   //   ref: 'category'
    //   // },
    //   // status: {
    //   //   type: String,
    //   //   required: true,   
    //   // },
    //   // display: {
    //   //   type: String,
    //   //   required: true
    //   // },

    //   isBlocked: {
    //     type: Boolean,
    //     default: false,
    // },

    