import { useState } from 'react';
import { aiService } from '../services/aiService';
import { Sparkles, Copy, Check } from 'lucide-react';

const AICaptionHelper = ({ onCaptionSelect, imageDescription }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await aiService.getCaptionSuggestions(imageDescription);
      setSuggestions(response.captions || []);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-purple-900">AI Caption Assistant</h3>
      </div>
      
      <button
        onClick={generateSuggestions}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
      >
        {loading ? 'Generating...' : '✨ Generate Caption Ideas'}
      </button>

      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-gray-600">Suggestions:</p>
          {suggestions.map((caption, index) => (
            <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
              <p className="text-sm flex-1">{caption}</p>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => onCaptionSelect(caption)}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Use
                </button>
                <button
                  onClick={() => copyToClipboard(caption, index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AICaptionHelper;