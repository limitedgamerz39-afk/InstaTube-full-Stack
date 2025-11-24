import { useState } from 'react';
import { AiOutlineTag, AiOutlineClose } from 'react-icons/ai';

const ProductTag = ({ x, y, product, onRemove, onClick }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Tag Indicator */}
      <div
        className="absolute bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer z-10"
        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
        onClick={() => setShowDetails(true)}
      >
        <AiOutlineTag size={16} />
      </div>

      {/* Product Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
            
            <div className="p-4">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}
              
              <h4 className="font-semibold text-lg mb-2">{product.name}</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{product.description}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">
                  ${(product.discountedPrice || product.price).toFixed(2)}
                </span>
                <button
                  onClick={() => {
                    // In a real implementation, this would add to cart
                    alert(`Added ${product.name} to cart!`);
                    setShowDetails(false);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductTag;