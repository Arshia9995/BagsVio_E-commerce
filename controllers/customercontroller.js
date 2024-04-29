const express = require('express');
const router = express.Router();
const customerModel=require('../models/user')


module.exports={

    Customers:async(req,res)=>{
        try {

            const page = parseInt(req.query.page) || 1; // Current page number
            const perPage = 10; // Number of customers per page
    

            const customers = await customerModel
            .find({})
            .skip((page - 1) * perPage) // Skip customers for previous pages
            .limit(perPage); // Limit customers for the current page

            console.log(customers)

            const customersCount = await customerModel.countDocuments();
        const totalPages = Math.ceil(customersCount / perPage);

            res.render('./admin/customers',{customers, title:"Admin Customers",currentPage: page, totalPages,perPage })
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












