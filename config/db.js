const mongoose = require('mongoose')



  function connectdb(){

    mongoose.connect(process.env.MONGO_URI,{
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
      .then(()=>{
        console.log('connected')
      })
      .catch((error)=>{
        console.log('not connected',error)
      }
      )


  }

  module.exports=connectdb

  
  