import React from 'react';

const StepNavigation = ({ currentStep, totalSteps, onStepChange }) => {
  const steps = [
    { id: 1, name: 'Type', description: 'Choose content type' },
    { id: 2, name: 'Media', description: 'Select your content' },
    { id: 3, name: 'Editor', description: 'Add effects and filters' },
    { id: 4, name: 'Details', description: 'Add title and description' },
    { id: 5, name: 'Upload', description: 'Publish your content' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10 transform -translate-y-1/2">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
        </div>
        
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center relative z-10">
            <button
              onClick={() => onStepChange(step.id)}
              disabled={step.id > currentStep}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                step.id < currentStep
                  ? 'bg-primary text-white border-2 border-primary'
                  : step.id === currentStep
                  ? 'bg-white dark:bg-gray-800 text-primary border-2 border-primary'
                  : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-600'
              }`}
            >
              {step.id < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                step.id
              )}
            </button>
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${
                step.id <= currentStep 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepNavigation;