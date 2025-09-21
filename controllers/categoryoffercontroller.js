const CategoryOffer = require('../models/categoryoffer');
const Category = require('../models/categorySchema');

// Get category offer page
const getCategoryOfferPage = async (req, res) => {
    try {
        const categoryOffers = await CategoryOffer.find()
            .populate('categoryId', 'categoryName')
            .sort({ createdAt: -1 });
        
        res.render('admin/categoryoffer', {
            categoryOffers,
            title: "Category Offers"
        });
    } catch (error) {
        console.error('Error fetching category offers:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Get categories for dropdown
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isBlocked: false });
        res.json({ categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

// Add category offer
const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, discountPercentage, startDate, endDate } = req.body;

        // Check if category already has an active offer
        const existingOffer = await CategoryOffer.findOne({
            categoryId: categoryId,
            isActive: true,
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) }
                }
            ]
        });

        if (existingOffer) {
            return res.status(400).json({ 
                error: 'This category already has an active offer during the specified period' 
            });
        }

        // Get category name
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const categoryOffer = new CategoryOffer({
            categoryId,
            categoryName: category.categoryName,
            discountPercentage,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        await categoryOffer.save();
        res.json({ success: true, message: 'Category offer added successfully' });
    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ error: 'Failed to add category offer' });
    }
};

// Edit category offer
const editCategoryOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        const { categoryId, discountPercentage, startDate, endDate } = req.body;

        // Check if category already has an active offer (excluding current offer)
        const existingOffer = await CategoryOffer.findOne({
            categoryId: categoryId,
            isActive: true,
            _id: { $ne: offerId },
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) }
                }
            ]
        });

        if (existingOffer) {
            return res.status(400).json({ 
                error: 'This category already has an active offer during the specified period' 
            });
        }

        // Get category name
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const updatedOffer = await CategoryOffer.findByIdAndUpdate(
            offerId,
            {
                categoryId,
                categoryName: category.categoryName,
                discountPercentage,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            },
            { new: true }
        );

        if (!updatedOffer) {
            return res.status(404).json({ error: 'Category offer not found' });
        }

        res.json({ success: true, message: 'Category offer updated successfully' });
    } catch (error) {
        console.error('Error editing category offer:', error);
        res.status(500).json({ error: 'Failed to edit category offer' });
    }
};

// Delete category offer
const deleteCategoryOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const deletedOffer = await CategoryOffer.findByIdAndDelete(offerId);
        
        if (!deletedOffer) {
            return res.status(404).json({ error: 'Category offer not found' });
        }

        res.json({ success: true, message: 'Category offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting category offer:', error);
        res.status(500).json({ error: 'Failed to delete category offer' });
    }
};

// Toggle offer status
const toggleOfferStatus = async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const offer = await CategoryOffer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ error: 'Category offer not found' });
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        res.json({ 
            success: true, 
            message: `Category offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: offer.isActive
        });
    } catch (error) {
        console.error('Error toggling offer status:', error);
        res.status(500).json({ error: 'Failed to toggle offer status' });
    }
};

module.exports = {
    getCategoryOfferPage,
    getCategories,
    addCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    toggleOfferStatus
};
