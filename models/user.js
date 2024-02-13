const mongoose=require('mongoose')


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

    lastName: {
        type: String,
      },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    // confirmPassword:{
    //     type:String,
    //     required:true
    // }
    isBlocked:{
        type:Boolean,
        default:false
    },
    phoneNumber: {
        type: String,
     
      },
      profilePicture: {
        type: String,
      },
      addresses:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
      },
})

const Users = mongoose.model('users',userSchema)
module.exports=Users