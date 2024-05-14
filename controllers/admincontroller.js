
const Product = require('../models/productSchema');
const Category=require('../models/categorySchema');
const Users = require("../models/user");
const Orders = require("../models/order")
const moment = require('moment')
const pdf = require("../utility/pdf");


const express = require('express');
const router = express.Router();



const credentials ={
    email:'admin@gmail.com',
    password:123
}



const toLogin = (req,res)=>{
    res.render('admin/adminlog',{ title:"Admin login"})
}
const admindashboard = async (req, res) => {
    try {
      
        const totalCustomers = await Users?.countDocuments();
        const totalOrders = await Orders?.countDocuments();
        const totalProducts = await Product?.countDocuments();

         // Fetch top 10 best-selling products
        const topProducts = await Orders?.aggregate([
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalQuantitySold: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $project: { _id: 0, productDetails: 1, totalQuantitySold: 1 } }
        ]);
        console.log(topProducts,"toppppppppppppppppppp");

      
const topCategories = await Orders?.aggregate([
  { $unwind: '$products' },
  { $lookup: { from: 'products', localField: 'products.productId', foreignField: '_id', as: 'productDetails' } },
  { $unwind: '$productDetails' },
  { $lookup: { from: 'categories', localField: 'productDetails.Category', foreignField: '_id', as: 'categoryDetails' } },
  { $unwind: '$categoryDetails' },
  { $group: { _id: '$categoryDetails.categoryName', totalQuantitySold: { $sum: '$products.quantity' } } },
  { $sort: { totalQuantitySold: -1 } },
  { $limit: 10 }
]);


      

      const topBrands = await Orders?.aggregate([
        { $unwind: '$products' },
        { $lookup: { from: 'products', localField: 'products.productId', foreignField: '_id', as: 'productDetails' } },
        { $unwind: '$productDetails' },
        { $lookup: { from: 'brands', localField: 'productDetails.BrandName', foreignField: '_id', as: 'brandDetails' } },
        { $unwind: '$brandDetails' },
        { $group: { _id: '$brandDetails.brandName', totalQuantitySold: { $sum: '$products.quantity' } } },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 10 }
    ]);
    
   
       
        res.render('admin/admindashboard', {
            totalCustomers,
            totalOrders,
            totalProducts,
            topProducts,
            topCategories,
            topBrands,
            title:"Admin Dashboard"
            
        });
    } catch (error) {
        console.error('Error fetching data for admin dashboard:', error);
        res.status(500).send('Internal Server Error');
    }
};



const adminLogin = (req,res)=>{
   
    const {email,password}=req.body;

    if(email==credentials.email&&password==credentials.password){
        
        req.session.isAdmin=true;
        res.redirect('/admin/admindashboard')
    }
};
const getSalesPage = async(req,res)=>{
    try {

    
      const orders = await Orders.find()
        .populate("products.productId")
        .populate("userId");
      

        let totalIncome = 0;
        let totalQuantitySold = 0;

        orders.forEach(order => {
            if (order.status === 'Delivered') {
                totalIncome += order.totalPrice; 
                order.products.forEach(product => {
                    totalQuantitySold += product.quantity;
                });
            }
        });


     
      res.render("admin/sales",{orders,totalIncome,totalQuantitySold, title:"Admin Sales Page" })

        
    } catch (error) {
        
    }
};

const getCount = async (req, res) => {
    try {
      const orders = await Orders.find({
        status: {
          $nin:["returned","Cancelled","Rejected"]
        }
      });
      const orderCountsByDay = {};
      const totalAmountByDay = {};
      const orderCountsByMonthYear = {};
      const totalAmountByMonthYear = {};
      const orderCountsByYear = {};
      const totalAmountByYear = {};
      let labelsByCount;
      let labelsByAmount;
      let dataByCount;
      let dataByAmount;
     
      orders.forEach((order) => {
       
        const orderDate = moment(order.orderDate, "ddd, MMM D, YYYY h:mm A");
        const dayMonthYear = orderDate.format("YYYY-MM-DD");
        const monthYear = orderDate.format("YYYY-MM");
        const year = orderDate.format("YYYY");
        
        if (req.url === "/count-orders-by-day") {
          
          if (!orderCountsByDay[dayMonthYear]) {
            orderCountsByDay[dayMonthYear] = 1;
            totalAmountByDay[dayMonthYear] = order.totalPrice
          } else {
            orderCountsByDay[dayMonthYear]++;
            totalAmountByDay[dayMonthYear] += order.totalPrice
          }
          const ordersByDay = Object.keys(orderCountsByDay).map(
            (dayMonthYear) => ({
              _id: dayMonthYear,
              count: orderCountsByDay[dayMonthYear],
            })
          );
          const amountsByDay = Object.keys(totalAmountByDay).map(
            (dayMonthYear) => ({
              _id: dayMonthYear,
              total: totalAmountByDay[dayMonthYear],
            })
          );
          amountsByDay.sort((a,b)=> (a._id < b._id ? -1 : 1));
          ordersByDay.sort((a, b) => (a._id < b._id ? -1 : 1));
          labelsByCount = ordersByDay.map((entry) =>
            moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
          );
          labelsByAmount = amountsByDay.map((entry) =>
            moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
          );
          dataByCount = ordersByDay.map((entry) => entry.count);
          dataByAmount = amountsByDay.map((entry) => entry.total);


        } else if (req.url === "/count-orders-by-month") {
          if (!orderCountsByMonthYear[monthYear]) {
            orderCountsByMonthYear[monthYear] = 1;
            totalAmountByMonthYear[monthYear] = order.totalPrice;
          } else {
            orderCountsByMonthYear[monthYear]++;
            totalAmountByMonthYear[monthYear] += order.totalPrice;
          }
        
          const ordersByMonth = Object.keys(orderCountsByMonthYear).map(
            (monthYear) => ({
              _id: monthYear,
              count: orderCountsByMonthYear[monthYear],
            })
          );
          const amountsByMonth = Object.keys(totalAmountByMonthYear).map(
            (monthYear) => ({
              _id: monthYear,
              total: totalAmountByMonthYear[monthYear],
            })
          );
         
        
          ordersByMonth.sort((a, b) => (a._id < b._id ? -1 : 1));
          amountsByMonth.sort((a, b) => (a._id < b._id ? -1 : 1));
        
          labelsByCount = ordersByMonth.map((entry) =>
            moment(entry._id, "YYYY-MM").format("MMM YYYY")
          );
          labelsByAmount = amountsByMonth.map((entry) =>
            moment(entry._id, "YYYY-MM").format("MMM YYYY")
          );
          dataByCount = ordersByMonth.map((entry) => entry.count);
          dataByAmount = amountsByMonth.map((entry) => entry.total);
        } else if (req.url === "/count-orders-by-year") {
          // Count orders by year
          if (!orderCountsByYear[year]) {
            orderCountsByYear[year] = 1;
            totalAmountByYear[year] = order.totalPrice;
          } else {
            orderCountsByYear[year]++;
            totalAmountByYear[year] += order.totalPrice;
          }
        
          const ordersByYear = Object.keys(orderCountsByYear).map((year) => ({
            _id: year,
            count: orderCountsByYear[year],
          }));
          const amountsByYear = Object.keys(totalAmountByYear).map((year) => ({
            _id: year,
            total: totalAmountByYear[year],
          }));


          
          ordersByYear.sort((a, b) => (a._id < b._id ? -1 : 1));
          amountsByYear.sort((a, b) => (a._id < b._id ? -1 : 1));
          
          labelsByCount = ordersByYear.map((entry) =>
            moment(entry._id, "YYYY").format("YYYY")
          );
          labelsByAmount = amountsByYear.map((entry) =>
            moment(entry._id, "YYYY").format("YYYY")
          );
        //   labelsByAmount = amountsByYear.map((entry) => entry._id);
          dataByCount = ordersByYear.map((entry) => entry.count);
          dataByAmount = amountsByYear.map((entry) => entry.total);
        }
      });


      res.json({ labelsByCount,labelsByAmount, dataByCount, dataByAmount });
    } catch (err) {
      console.error(err);
    }
  }
  const getDownloadSalesReport= async (req,res)=>{
    console.log(req.body);
    try {
      const startDate = req.body.startDate
      const format = req.body.fileFormat
      const endDate = req.body.endDate
      const orders = await Orders.find({ status: 'Delivered' }).populate('products.productId');
      const totalSales = await Orders.aggregate([
        {
        $match:{
          status: 'Delivered',
        }
    },
    {
      $group: {
        _id: null,
        totalSales: {$sum: '$totalPrice'}
      }
    }
  ])

  const sum = totalSales.length > 0 ? totalSales[0].totalSales : 0;
  pdf.downloadPdf(req,res,orders,startDate,endDate,totalSales)
  
    } catch (error) {
      console.log(error);
    }

  },

  logout= (req, res) => {
    console.log("inside logout",req.session);
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
      } else {
        res.redirect('/admin');
      }
    }); 
  }


module.exports={
    toLogin,
    adminLogin ,
    admindashboard,
    getSalesPage,
    getCount,
    getDownloadSalesReport,
    logout
}