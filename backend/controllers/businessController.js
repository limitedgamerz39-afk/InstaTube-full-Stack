import User from '../models/User.js';
import Product from '../models/Product.js';
import Revenue from '../models/Revenue.js';

// @desc    Get business profile
// @route   GET /api/business/profile
// @access  Private/Business
export const getBusinessProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        businessProfile: user.businessProfile,
        isBusinessProfileActive: user.isBusinessProfileActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update business profile
// @route   PUT /api/business/profile
// @access  Private/Business
export const updateBusinessProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    const {
      companyName,
      businessCategory,
      contactEmail,
      contactPhone,
      website,
      address,
      businessHours,
    } = req.body;
    
    // Update business profile fields
    if (companyName !== undefined) user.businessProfile.companyName = companyName;
    if (businessCategory !== undefined) user.businessProfile.businessCategory = businessCategory;
    if (contactEmail !== undefined) user.businessProfile.contactEmail = contactEmail;
    if (contactPhone !== undefined) user.businessProfile.contactPhone = contactPhone;
    if (website !== undefined) user.businessProfile.website = website;
    if (address !== undefined) user.businessProfile.address = address;
    if (businessHours !== undefined) user.businessProfile.businessHours = businessHours;
    
    // Activate business profile if it's being updated
    user.isBusinessProfileActive = true;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      data: {
        businessProfile: user.businessProfile,
        isBusinessProfileActive: user.isBusinessProfileActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get business analytics
// @route   GET /api/business/analytics
// @access  Private/Business
export const getBusinessAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    // Get product sales data
    const products = await Product.find({ seller: user._id });
    
    // Get revenue data
    const revenueData = await Revenue.find({ creator: user._id });
    
    // Calculate total sales
    const totalSales = revenueData.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate monthly sales
    const monthlySales = {};
    revenueData.forEach(item => {
      const month = new Date(item.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!monthlySales[month]) {
        monthlySales[month] = 0;
      }
      monthlySales[month] += item.amount;
    });
    
    // Get top selling products
    const productSales = {};
    products.forEach(product => {
      const productRevenue = revenueData
        .filter(item => item.product && item.product.toString() === product._id.toString())
        .reduce((sum, item) => sum + item.amount, 0);
      if (productRevenue > 0) {
        productSales[product.name] = productRevenue;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalProducts: products.length,
          totalSales,
          totalRevenue: totalSales,
        },
        monthlySales,
        productSales,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create business product
// @route   POST /api/business/products
// @access  Private/Business
export const createBusinessProduct = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    const product = new Product({
      ...req.body,
      seller: user._id
    });
    
    const createdProduct = await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get business products
// @route   GET /api/business/products
// @access  Private/Business
export const getBusinessProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    const products = await Product.find({ seller: user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update business product
// @route   PUT /api/business/products/:productId
// @access  Private/Business
export const updateBusinessProduct = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products.',
      });
    }
    
    // Update product fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'seller') { // Prevent changing seller
        product[key] = req.body[key];
      }
    });
    
    const updatedProduct = await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete business product
// @route   DELETE /api/business/products/:productId
// @access  Private/Business
export const deleteBusinessProduct = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business account required.',
      });
    }
    
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
    
    // Check if user is the seller
    if (product.seller.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products.',
      });
    }
    
    await product.remove();
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};