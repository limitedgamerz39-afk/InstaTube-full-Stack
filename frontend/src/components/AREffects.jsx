import { useState } from 'react';
import { AiOutlineCamera, AiOutlineScan, AiOutlineSmile } from 'react-icons/ai';

// AR Effects options
const AR_EFFECTS = [
  { id: 'none', name: 'None', icon: '🚫' },
  { id: 'flowers', name: 'Flowers', icon: '🌸' },
  { id: 'hearts', name: 'Hearts', icon: '❤️' },
  { id: 'fireworks', name: 'Fireworks', icon: '🎆' },
  { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' },
  { id: 'crown', name: 'Crown', icon: '👑' },
  { id: 'animal_ears', name: 'Animal Ears', icon: '🐰' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈' }
];

const AREffects = ({ selectedEffect, setSelectedEffect }) => {
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setShowEffectsPanel(!showEffectsPanel)}
        className="btn-outline flex items-center gap-2"
      >
        <AiOutlineScan />
        AR Effects
      </button>

      {showEffectsPanel && (
        <div className="mt-3 bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">AR Effects</h4>
          <div className="grid grid-cols-4 gap-2">
            {AR_EFFECTS.map((effect) => (
              <button
                key={effect.id}
                type="button"
                onClick={() => setSelectedEffect(effect.id)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center transition ${
                  selectedEffect === effect.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="text-2xl mb-1">{effect.icon}</span>
                <span className="text-xs">{effect.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AREffects;