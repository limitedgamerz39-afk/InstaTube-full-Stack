import { useState } from 'react';
import { AiOutlineEnvironment, AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';

const LocationPicker = ({ 
  selectedLocation, 
  onLocationSelect, 
  onLocationRemove,
  showPicker,
  setShowPicker
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock locations data
  const mockLocations = [
    { id: 1, name: 'Central Park, New York', lat: 40.7812, lng: -73.9665 },
    { id: 2, name: 'Times Square, New York', lat: 40.7580, lng: -73.9855 },
    { id: 3, name: 'Brooklyn Bridge, New York', lat: 40.7061, lng: -73.9969 },
    { id: 4, name: 'Empire State Building, New York', lat: 40.7484, lng: -73.9857 },
    { id: 5, name: 'Statue of Liberty, New York', lat: 40.6892, lng: -74.0445 },
    { id: 6, name: 'Golden Gate Bridge, San Francisco', lat: 37.8199, lng: -122.4783 },
    { id: 7, name: 'Fisherman\'s Wharf, San Francisco', lat: 37.8015, lng: -122.4082 },
    { id: 8, name: 'Alcatraz Island, San Francisco', lat: 37.8267, lng: -122.4230 },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setLocations([]);
      return;
    }
    
    // In a real implementation, this would call a geolocation API
    const filtered = mockLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase())
    );
    setLocations(filtered);
  };

  const selectLocation = (location) => {
    onLocationSelect(location);
    setShowPicker(false);
    setSearchQuery('');
    setLocations([]);
  };

  if (!showPicker) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Location</h3>
          <button
            onClick={() => setShowPicker(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <AiOutlineClose size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative">
            <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for a place..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>

        {/* Selected Location */}
        {selectedLocation && (
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AiOutlineEnvironment className="text-blue-500" />
                <span>{selectedLocation.name}</span>
              </div>
              <button
                onClick={onLocationRemove}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : locations.length > 0 ? (
            <div className="divide-y dark:divide-gray-700">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectLocation(location)}
                  className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                >
                  <AiOutlineEnvironment className="text-blue-500" />
                  <div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="p-4 text-center text-gray-500">No locations found</div>
          ) : (
            <div className="p-4">
              <h4 className="font-medium mb-2">Popular Places</h4>
              <div className="space-y-2">
                {mockLocations.slice(0, 5).map((location) => (
                  <button
                    key={location.id}
                    onClick={() => selectLocation(location)}
                    className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                  >
                    <AiOutlineEnvironment className="text-blue-500" />
                    <span>{location.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;