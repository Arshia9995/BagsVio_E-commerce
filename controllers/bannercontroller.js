const Banner = require("../models/banner")
const  upload   = require("../middleware/multer");
const Category = require("../models/categorySchema");
const { default: mongoose } = require("mongoose");



module.exports = {

    getBannerPage:async(req,res)=>{
        try {
            const categories = await Category.find();
            const banners = await Banner.find().populate('category'); 
            res.render('./admin/banner', { categories, banners, title:"Admin Banner" });
          } catch (error) {
            console.error('Error fetching categories and banners:', error);
            res.status(500).send('Internal server error');
          }
    },
    addBanner: async (req, res) => {
        upload.single('image')(req, res, async (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).send('Error uploading file');
            }
    
            try {
                if (req.file) {
                    const { category } = req.body;
                    console.log('category',category)
                    const newObjectId = new mongoose.Types.ObjectId(category) 
                    console.log('this is teh new objectId',newObjectId)   
                  
                    const categoryObject = await Category.findOne({ _id: newObjectId });
                    console.log('categoryobject',categoryObject)
    
                    if (!categoryObject) {
                        return res.status(400).json({ success: false, message: 'Category not found' });
                    }
    
                    
                   
                    const newBanner = new Banner({
                        image: req.file.filename,
                        category: categoryObject._id,
                    });
    
                 
                    const savedBanner = await newBanner.save();
                  
    
                    return res.json({ success: true, imageUrl: savedBanner.image,banner:savedBanner });

    
                } else {
                    return res.json({ success: false, message: 'No file provided' });
                }
            } catch (error) {
                console.error('Error saving to MongoDB:', error);
                res.status(500).json({ success: false, message: 'Internal server error' });
            }
        });
    },
    deleteBanner: async (req, res) => {
        const bannerId = req.params.bannerId;
       
        try {
            
            const deletedBanner = await Banner.findByIdAndDelete(bannerId);
          
            if (deletedBanner) {
                res.json({ success: true, message: 'Banner deleted successfully' });
            } else {
                res.json({ success: false, message: 'Banner not found' });
            }
           } catch (error) {
            console.error('Error deleting banner:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    },

    updateBanner: async (req, res) => {

        upload.single('image')(req, res, async (err) => {
        


        const bannerId = req.params.bannerId; 
       
        
    
        try {
          
            const banner = await Banner.findById(bannerId);
            if (!banner) {
                return res.status(404).json({ success: false, message: 'Banner not found' });
            }
    
           
            banner.category = req.body.category; 
            if(req.file){
                banner.image = req.file.filename; 
            }
    
           
            const updatedBanner = await banner.save();
    
            
            res.status(200).json({ success: true, banner: updatedBanner });
        } catch (error) {
            console.error('Error updating banner:', error);
            res.status(500).json({ success: false, message: 'Error updating banner' });
        }
    })
}


}
