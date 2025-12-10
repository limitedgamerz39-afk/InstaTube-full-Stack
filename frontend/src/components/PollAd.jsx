import { useState } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const PollAd = ({ question = "Which product do you prefer?", options = [], onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [votes, setVotes] = useState(options.map(() => Math.floor(Math.random() * 100)));
  const [hasVoted, setHasVoted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleVote = (optionIndex) => {
    if (hasVoted) return;
    
    setSelectedOption(optionIndex);
    setHasVoted(true);
    
    // Update votes (mock)
    const newVotes = [...votes];
    newVotes[optionIndex] += 1;
    setVotes(newVotes);
  };

  const getTotalVotes = () => {
    return votes.reduce((sum, vote) => sum + vote, 0);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md mb-4 overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sponsored • Poll</span>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close ad"
        >
          <AiOutlineClose size={16} />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-3">{question}</h3>
        
        <div className="space-y-3">
          {options.map((option, index) => {
            const percentage = getTotalVotes() > 0 ? Math.round((votes[index] / getTotalVotes()) * 100) : 0;
            
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleVote(index)}
                  disabled={hasVoted}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    hasVoted 
                      ? selectedOption === index 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-gray-200 dark:border-gray-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{option}</span>
                    {hasVoted && (
                      <span className="text-sm font-semibold">
                        {percentage}%
                      </span>
                    )}
                  </div>
                  
                  {hasVoted && (
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        
        {hasVoted && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
            {getTotalVotes()} votes
          </p>
        )}
        
        {!hasVoted && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
            Click to vote
          </p>
        )}
      </div>
    </div>
  );
};

export default PollAd;