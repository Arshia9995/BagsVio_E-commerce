const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
    image : String ,
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'category' 
},
})

const Banner = mongoose.model('Banner',bannerSchema)
module.exports = Banner;