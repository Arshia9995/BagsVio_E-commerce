const express = require('express');
const router = express.Router();
const customerModel=require('../models/user')


module.exports={

    Customers:async(req,res)=>{
        try {

            const customers=await customerModel.find({})
            console.log(customers)
            res.render('./admin/customers',{customers})
        } catch (error) {
            console.error(`Error fetching customers: ${error.message}`);
            res.status(500).send('Internal Server Error');
            
        }},
        BlockCustomer: async (req, res) => {
            const customerId = req.params.customerId
    
            try {
                // Find the user by ID and update the isBlocked field
                await customerModel.findByIdAndUpdate(customerId, { isBlocked: true });
    
                res.redirect('/admin/customers'); // Redirect to the customers page or another appropriate location
            } catch (error) {
                console.error(`Error blocking customer: ${error.message}`);
                res.status(500).send('Internal Server Error');
            }
        },
        UnblockCustomer: async (req, res) => {
            const customerId = req.params.customerId;
    
            try {
                // Find the user by ID and update the isBlocked field
                await customerModel.findByIdAndUpdate(customerId, { isBlocked: false });
    
                res.redirect('/admin/customers'); // Redirect to the customers page or another appropriate location
            } catch (error) {
                console.error(`Error unblocking customer: ${error.message}`);
                res.status(500).send('Internal Server Error');
            }
        },
    }












