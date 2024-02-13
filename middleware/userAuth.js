const express = require('express');
const session=require('express-session')





// const userExist = (req,res,next)=>{
//     if(!req.session.email){
//         next()
//     }else{
//         res.redirect('/userhome')
//     }
// };
// // check the user is authenticated
// const verifyUser = (req,res,next)=>{
//     if(req.session.email){
//         next()
//     }else{
//         res.redirect('/login')
//     }
// };

const verifyUser = (req,res,next)=>{
    if(req.session.email){
        next()
    }else{
        res.redirect('/login')
    }
};

const userExist = (req, res, next) => {
    if (!req.session.email || !req.session.userLogged) {
        next();  // Continue to the next middleware or route
    } else {
        res.redirect('/userhome');
    }
};




module.exports={
    verifyUser,
    userExist
}