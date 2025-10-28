import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import { AiOutlineSearch, AiOutlineMessage } from 'react-icons/ai';
import toast from 'react-hot-toast';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await userAPI.searchUsers(searchQuery);
      setResults(response.data.data);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Search Results</h1>

      {/* Results */}
      <div className="card dark:bg-dark-card">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <AiOutlineSearch size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {query ? 'No users found' : 'Use the search bar above to find users'}
            </p>
            {query && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Try searching with a different username or name
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-border">
            {results.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition"
              >
                <Link to={`/profile/${user.username}`}>
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                </Link>
                <Link to={`/profile/${user.username}`} className="flex-1">
                  <p className="font-semibold dark:text-white">{user.username}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.fullName}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {user.bio}
                    </p>
                  )}
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    <span className="font-semibold block">{user.followers.length}</span>
                    <span className="text-xs">followers</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/messages/${user.username}`);
                    }}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg font-semibold hover:shadow-glow transition flex items-center space-x-2"
                  >
                    <AiOutlineMessage size={16} />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
