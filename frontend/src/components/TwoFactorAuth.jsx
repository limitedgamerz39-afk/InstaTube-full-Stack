import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TwoFactorAuth = () => {
  const [token, setToken] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { verifyTwoFactor, setRequires2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (useBackup && !backupCode.trim()) {
        toast.error('Please enter a backup code');
        setLoading(false);
        return;
      }
      
      if (!useBackup && !token.trim()) {
        toast.error('Please enter a 2FA token');
        setLoading(false);
        return;
      }
      
      await verifyTwoFactor(useBackup ? null : token, useBackup ? backupCode : null);
      toast.success('2FA verification successful!');
      navigate('/');
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error(error.response?.data?.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setRequires2FA(false);
    setToken('');
    setBackupCode('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-secondary-50 dark:from-dark.bg dark:via-dark.bg-secondary dark:to-dark.bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 card glass-card p-8 rounded-3xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4 animate-float">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white gradient-text">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Enter your 2FA code to complete login
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {useBackup ? (
              <div>
                <label htmlFor="backupCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backup Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="backupCode"
                    name="backupCode"
                    type="text"
                    required
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter backup code"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  2FA Token
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="token"
                    name="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Enter 6-digit code"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setUseBackup(!useBackup)}
              className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              {useBackup ? 'Use 2FA Token Instead' : 'Use Backup Code'}
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 btn-secondary py-3.5 px-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-gradient py-3.5 px-4 rounded-xl shadow-glow-lg hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95 flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;