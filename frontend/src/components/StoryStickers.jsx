import { useState } from 'react';
import { AiOutlineCheck } from 'react-icons/ai';

// Poll Sticker Component
export const PollSticker = ({ poll, onVote, hasVoted }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleVote = (optionIndex) => {
    if (hasVoted) return;
    setSelectedOption(optionIndex);
    onVote(optionIndex);
  };

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 w-full max-w-xs">
      <p className="text-white font-bold mb-3 text-center">{poll.question}</p>
      
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = selectedOption === index;
          const isWinning = option.votes === Math.max(...poll.options.map(o => o.votes));

          return (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={hasVoted}
              className={`relative w-full text-left p-3 rounded-2xl overflow-hidden transition-all ${
                hasVoted
                  ? isWinning
                    ? 'bg-gradient-primary'
                    : 'bg-white/20'
                  : 'bg-white/20 hover:bg-white/30'
              } ${isSelected ? 'ring-2 ring-white' : ''}`}
            >
              {/* Progress Bar */}
              {hasVoted && (
                <div
                  className="absolute inset-0 bg-white/20"
                  style={{ width: `${percentage}%` }}
                ></div>
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between">
                <span className="text-white font-semibold">{option.text}</span>
                {hasVoted && (
                  <span className="text-white font-bold">{percentage.toFixed(0)}%</span>
                )}
                {isSelected && !hasVoted && (
                  <AiOutlineCheck className="text-white" size={20} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-white/80 text-xs text-center mt-2">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </p>
      )}
    </div>
  );
};

// Quiz Sticker Component
export const QuizSticker = ({ quiz, onAnswer, hasAnswered }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answerIndex) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    onAnswer(answerIndex);
  };

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-4 w-full max-w-xs">
      <div className="text-center mb-3">
        <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-white text-sm font-bold">
          QUIZ
        </span>
      </div>
      
      <p className="text-white font-bold mb-4 text-center">{quiz.question}</p>
      
      <div className="space-y-2">
        {quiz.options.map((option, index) => {
          const isCorrect = index === quiz.correctAnswer;
          const isSelected = selectedAnswer === index;

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={`w-full text-left p-3 rounded-2xl font-semibold transition-all ${
                showResult
                  ? isCorrect
                    ? 'bg-green-500 text-white'
                    : isSelected
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white/60'
                  : 'bg-white/30 hover:bg-white/40 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && isCorrect && <span>✅</span>}
                {showResult && isSelected && !isCorrect && <span>❌</span>}
              </div>
            </button>
          );
        })}
      </div>

      {showResult && (
        <p className="text-white text-center mt-3 text-sm">
          {selectedAnswer === quiz.correctAnswer ? '🎉 Correct!' : '😅 Try again next time!'}
        </p>
      )}
    </div>
  );
};

// Slider Sticker Component
export const SliderSticker = ({ slider, onSlide, hasSlid }) => {
  const [value, setValue] = useState(50);

  const handleSlide = (e) => {
    if (hasSlid) return;
    const newValue = parseInt(e.target.value);
    setValue(newValue);
  };

  const handleSubmit = () => {
    if (hasSlid) return;
    onSlide(value);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 w-full max-w-xs">
      <p className="text-white font-bold mb-4 text-center">{slider.question}</p>
      
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleSlide}
          disabled={hasSlid}
          className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #8B5CF6 0%, #EC4899 ${value}%, rgba(255,255,255,0.2) ${value}%, rgba(255,255,255,0.2) 100%)`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-white text-sm mb-3">
        <span>{slider.minLabel || '😢'}</span>
        <span className="font-bold text-2xl">{value}</span>
        <span>{slider.maxLabel || '😍'}</span>
      </div>

      {!hasSlid && (
        <button
          onClick={handleSubmit}
          className="w-full btn-primary"
        >
          Submit
        </button>
      )}

      {hasSlid && (
        <p className="text-white/80 text-xs text-center">Thanks for your response!</p>
      )}
    </div>
  );
};

// Question Sticker Component
export const QuestionSticker = ({ onSubmit }) => {
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim() || submitted) return;
    
    onSubmit(answer);
    setSubmitted(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-4 w-full max-w-xs">
      <p className="text-white font-bold mb-3 text-center">Ask me anything!</p>
      
      {!submitted ? (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full bg-white/20 text-white placeholder-white/60 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white mb-2"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!answer.trim()}
            className={`w-full py-2 rounded-2xl font-semibold transition-all ${
              answer.trim()
                ? 'bg-white text-purple-600 hover:scale-105'
                : 'bg-white/20 text-white/40 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </form>
      ) : (
        <div className="text-center text-white">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-sm">Response sent!</p>
        </div>
      )}
    </div>
  );
};
