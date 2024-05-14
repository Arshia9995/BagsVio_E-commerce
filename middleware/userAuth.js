const express = require('express');
const session=require('express-session')






const verifyUser = (req,res,next)=>{
    if(req.session.userLogged){
        next()
    }else{
        res.redirect('/login')
    }
};

const userExist = (req, res, next) => {
    if (!req.session.email || !req.session.userLogged) {
        next();  
    } else {
        res.redirect('/userhome');
    }
};




module.exports={
    verifyUser,
    userExist
}