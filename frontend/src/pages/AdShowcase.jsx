import { useState } from 'react';
import VideoAd from '../components/VideoAd';
import MastheadAd from '../components/MastheadAd';
import OverlayAd from '../components/OverlayAd';
import CarouselAd from '../components/CarouselAd';
import PollAd from '../components/PollAd';
import StoriesAd from '../components/StoriesAd';
import FeedAdCard from '../components/FeedAdCard';

const AdShowcase = () => {
  const [showVideoAd, setShowVideoAd] = useState(false);
  const [videoAdType, setVideoAdType] = useState('pre-roll');
  const [videoAdFormat, setVideoAdFormat] = useState('skippable');
  
  const mockImages = [
    'https://placehold.co/600x400/FF6B6B/white?text=Product+1',
    'https://placehold.co/600x400/4ECDC4/white?text=Product+2',
    'https://placehold.co/600x400/45B7D1/white?text=Product+3',
    'https://placehold.co/600x400/96CEB4/white?text=Product+4'
  ];

  const pollOptions = [
    "Smartphone X",
    "Tablet Pro",
    "Laptop Ultra",
    "Smart Watch"
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Ad Showcase</h1>
        
        {/* YouTube Ads Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">YouTube Ads</h2>
          
          {/* Masthead Ad */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Masthead Ad</h3>
            <MastheadAd />
          </div>
          
          {/* Video Ads Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Video Ads</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => {
                  setVideoAdType('pre-roll');
                  setVideoAdFormat('skippable');
                  setShowVideoAd(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Skippable Pre-roll Ad
              </button>
              
              <button 
                onClick={() => {
                  setVideoAdType('pre-roll');
                  setVideoAdFormat('non-skippable');
                  setShowVideoAd(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Non-Skippable Pre-roll Ad
              </button>
              
              <button 
                onClick={() => {
                  setVideoAdType('pre-roll');
                  setVideoAdFormat('bumper');
                  setShowVideoAd(true);
                }}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                Bumper Ad
              </button>
            </div>
            
            {showVideoAd && (
              <div className="relative w-full h-96 bg-black rounded-lg overflow-hidden">
                <VideoAd 
                  type={videoAdType}
                  adFormat={videoAdFormat}
                  duration={videoAdFormat === 'bumper' ? 6 : 15}
                  onComplete={() => setShowVideoAd(false)}
                  onSkip={() => setShowVideoAd(false)}
                />
              </div>
            )}
          </div>
          
          {/* Other YouTube Ads */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* In-Feed Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">In-Feed Video Ad</h3>
              <FeedAdCard adSlot="feedAd" />
            </div>
            
            {/* Overlay Ad Demo */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Overlay Ad</h3>
              <div className="relative w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Video Content</h3>
                    <p>This represents a video player</p>
                  </div>
                </div>
                <OverlayAd position="bottom-right" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Instagram Ads Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-pink-600 dark:text-pink-400">Instagram Ads</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photo Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Photo Ad</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <img 
                    src="https://placehold.co/600x400/FF6B6B/white?text=Instagram+Photo+Ad" 
                    alt="Instagram Photo Ad"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="mt-3">
                    <h4 className="font-bold">Summer Collection Launch</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Discover our new summer styles with up to 40% off!</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Video Ad</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative w-full h-64 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <h4 className="font-bold text-lg">Product Demo Video</h4>
                      <p className="text-sm opacity-90">Click to play</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold">New Tech Gadget</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">See how this innovative device can change your life!</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Carousel Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Carousel Ad</h3>
              <FeedAdCard 
                adType="carousel" 
                carouselImages={mockImages} 
              />
            </div>
            
            {/* Stories Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Stories Ad</h3>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                <StoriesAd />
                <div className="w-40 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">User Story</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Facebook Ads Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-800 dark:text-blue-300">Facebook Ads</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Image Ad</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <img 
                    src="https://placehold.co/600x400/4ECDC4/white?text=Facebook+Image+Ad" 
                    alt="Facebook Image Ad"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="mt-3">
                    <h4 className="font-bold">Weekend Sale Event</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Join us for our biggest sale of the year. Up to 70% off!</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Video Ad</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative w-full h-64 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <h4 className="font-bold text-lg">Event Promo Video</h4>
                      <p className="text-sm opacity-90">Click to watch</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold">Annual Conference 2023</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Learn from industry experts and network with professionals.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Carousel Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Carousel Ad</h3>
              <FeedAdCard 
                adType="carousel" 
                carouselImages={mockImages} 
              />
            </div>
            
            {/* Poll Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Poll Ad</h3>
              <PollAd question="Which gadget are you most excited about?" options={pollOptions} />
            </div>
            
            {/* Slideshow Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Slideshow Ad</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative w-full h-64 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">📸</div>
                        <h4 className="font-bold text-lg">Travel Memories</h4>
                        <p className="text-sm opacity-90">Relive your favorite moments</p>
                      </div>
                    </div>
                    {/* Animated slideshow effect */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {[1, 2, 3, 4].map((item) => (
                        <div 
                          key={item} 
                          className={`w-2 h-2 rounded-full ${item === 1 ? 'bg-white' : 'bg-white bg-opacity-50'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold">Vacation Photo Book</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Create a beautiful photo book of your travels.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stories Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Stories Ad</h3>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                <StoriesAd />
                <div className="w-40 flex-shrink-0 bg-gray-200 dark:bg-gray-800 rounded-lg h-64 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">User Story</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Advanced Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">Advanced Ad Features</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shopping Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Shopping Ad (Concept)</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="relative">
                    <img 
                      src="https://placehold.co/600x400/96CEB4/white?text=Shopping+Ad" 
                      alt="Shopping Ad"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                      $49.99
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="font-bold">Designer Sunglasses</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">UV protection with polarized lenses</p>
                    <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Collection Ad */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Collection Ad (Concept)</h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored</span>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close ad">
                    <AiOutlineClose size={16} />
                  </button>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Product {item}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-bold">Spring Fashion Collection</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Complete your spring wardrobe with our latest arrivals.</p>
                    <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                      View Collection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdShowcase;