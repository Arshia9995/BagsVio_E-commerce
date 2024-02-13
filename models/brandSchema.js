const mongoose=require('mongoose');

const brandSchema= new mongoose.Schema({

    brandName: {
        type: String,
        required: true,
         unique: true,
        uppercase:true, 
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
  
     
    })



const brand = mongoose.model('brand', brandSchema);
module.exports = brand;