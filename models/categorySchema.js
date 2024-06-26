const mongoose=require('mongoose');

const categorySchema= new mongoose.Schema({

    categoryName: {
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

const category = mongoose.model('category', categorySchema);
module.exports = category;