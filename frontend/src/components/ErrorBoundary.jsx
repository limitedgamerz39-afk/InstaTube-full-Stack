import { Component } from 'react';
import toast from 'react-hot-toast';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error reporting service (in a real app, you'd send this to a service like Sentry)
    this.logErrorToService(error, errorInfo);
    
    // Show user-friendly toast notification
    toast.error('An unexpected error occurred. Please try again.');
  }

  logErrorToService = (error, errorInfo) => {
    // In a real application, you would send this to an error reporting service
    // Example: Sentry, Bugsnag, or a custom error logging API
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      console.log('Sending error to reporting service:', { error, errorInfo });
    }
  };

  handleReload = () => {
    // Clear any stored error state
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're sorry for the inconvenience. Please try refreshing the page or going back to the home screen.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReload}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Go to Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto text-gray-800 dark:text-gray-200">
                  {this.state.error?.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;