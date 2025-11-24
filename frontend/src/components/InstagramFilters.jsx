import { useState, useEffect } from 'react';
import { AiOutlineTag, AiOutlineShop, AiOutlineEnvironment } from 'react-icons/ai';
import { shoppingAPI } from '../services/shoppingAPI';

// Add filter options
const FILTERS = [
  { id: 'normal', name: 'Normal', filter: 'none' },
  { id: 'clarendon', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.35)' },
  { id: 'lark', name: 'Lark', filter: 'contrast(0.9) saturate(1.1) brightness(1.1)' },
  { id: 'moon', name: 'Moon', filter: 'grayscale(1) contrast(1.1)' },
  { id: 'reyes', name: 'Reyes', filter: 'sepia(0.4) contrast(1.1) saturate(1.1)' },
  { id: 'juno', name: 'Juno', filter: 'hue-rotate(-20deg) saturate(1.5)' }
];

// Add beauty filter options
const BEAUTY_FILTERS = [
  { id: 'none', name: 'None', intensity: 0 },
  { id: 'light', name: 'Light', intensity: 0.3 },
  { id: 'medium', name: 'Medium', intensity: 0.6 },
  { id: 'strong', name: 'Strong', intensity: 1.0 }
];

const SocialMediaFilters = ({ 
  selectedFilter, 
  setSelectedFilter, 
  beautyFilter, 
  setBeautyFilter,
  productTags,
  setProductTags,
  isBusinessProfile,
  setIsBusinessProfile,
  shoppingCartEnabled,
  setShoppingCartEnabled,
  checkInLocation,
  setCheckInLocation,
  highlightTitle,
  setHighlightTitle,
  igtvTitle,
  setIgtvTitle,
  category,
  user
}) => {
  const [showProductTagModal, setShowProductTagModal] = useState(false);
  const [currentTagPosition, setCurrentTagPosition] = useState({ x: 0, y: 0 });
  const [productTagInput, setProductTagInput] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch products for tagging
  useEffect(() => {
    const fetchProducts = async () => {
      if (!showProductTagModal) return;
      
      setLoadingProducts(true);
      try {
        const response = await shoppingAPI.getProducts('', 1, 20);
        // Ensure products is always an array
        setProducts(Array.isArray(response.data.products) ? response.data.products : []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]); // Set to empty array on error
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [showProductTagModal]);

  // Add product tag to image
  const addProductTag = (x, y) => {
    setCurrentTagPosition({ x, y });
    setShowProductTagModal(true);
  };

  // Save product tag
  const saveProductTag = () => {
    if (productTagInput.trim()) {
      const newTag = {
        id: Date.now(),
        x: currentTagPosition.x,
        y: currentTagPosition.y,
        product: productTagInput.trim()
      };
      
      setProductTags(prev => [...prev, newTag]);
      setProductTagInput('');
      setShowProductTagModal(false);
    }
  };

  // Remove product tag
  const removeProductTag = (tagId) => {
    setProductTags(prev => prev.filter(tag => tag.id !== tagId));
  };

  // Filter products based on search query
  // Ensure products is an array before filtering
  const filteredProducts = Array.isArray(products) ? products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4 mb-4">
      <h3 className="text-lg font-semibold dark:text-white">Social Media Features</h3>
      
      {/* Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Photo/Video Filters
        </label>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedFilter(filter.id)}
              className={`px-3 py-2 rounded-lg text-sm ${
                selectedFilter === filter.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Beauty Filters */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Beauty Filters
        </label>
        <div className="flex flex-wrap gap-2">
          {BEAUTY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setBeautyFilter(filter.id)}
              className={`px-3 py-2 rounded-lg text-sm ${
                beautyFilter === filter.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Business Profile Features */}
      {user?.role === 'business' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="business-profile"
              checked={isBusinessProfile}
              onChange={(e) => setIsBusinessProfile(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="business-profile" className="text-sm text-gray-700 dark:text-gray-300">
              Business Profile Features
            </label>
          </div>

          {isBusinessProfile && (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shopping-cart"
                  checked={shoppingCartEnabled}
                  onChange={(e) => setShoppingCartEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="shopping-cart" className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Shopping Cart
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Highlight Title
                </label>
                <input
                  type="text"
                  value={highlightTitle}
                  onChange={(e) => setHighlightTitle(e.target.value)}
                  placeholder="Add to story highlights"
                  className="input-field w-full"
                  maxLength={50}
                />
              </div>

              {category === 'long' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Video Title
                  </label>
                  <input
                    type="text"
                    value={igtvTitle}
                    onChange={(e) => setIgtvTitle(e.target.value)}
                    placeholder="Long video title"
                    className="input-field w-full"
                    maxLength={100}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Location Check-in */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Check-in Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={checkInLocation}
            onChange={(e) => setCheckInLocation(e.target.value)}
            placeholder="Add a location"
            className="flex-1 input-field"
          />
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="btn-outline flex items-center gap-1"
          >
            <AiOutlineEnvironment />
            <span className="hidden md:inline">Nearby</span>
          </button>
        </div>
      </div>

      {/* Product Tags Display */}
      {productTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tagged Products
          </label>
          <div className="space-y-2">
            {productTags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                <span className="text-sm">{tag.product}</span>
                <button 
                  type="button"
                  onClick={() => removeProductTag(tag.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Tag Modal */}
      {showProductTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Add Product Tag</h3>
            
            {/* Search Products */}
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="input-field w-full"
              />
            </div>
            
            {/* Product List */}
            <div className="mb-4 max-h-60 overflow-y-auto">
              {loadingProducts ? (
                <p className="text-center py-4">Loading products...</p>
              ) : filteredProducts.length > 0 ? (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        setProductTagInput(product.name);
                        saveProductTag();
                      }}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ${product.price}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No products found</p>
              )}
            </div>
            
            {/* Manual Input */}
            <div className="mb-4">
              <input
                type="text"
                value={productTagInput}
                onChange={(e) => setProductTagInput(e.target.value)}
                placeholder="Or enter product name manually"
                className="input-field w-full"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProductTagModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProductTag}
                className="btn-primary"
                disabled={!productTagInput.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-80 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Nearby Locations</h3>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {['Central Park, New York', 'Times Square, New York', 'Brooklyn Bridge, New York', 'Empire State Building, New York', 'Statue of Liberty, New York'].map((loc, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCheckInLocation(loc);
                    setShowLocationPicker(false);
                  }}
                  className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlineEnvironment />
                    <span>{loc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaFilters;