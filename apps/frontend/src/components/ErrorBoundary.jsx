import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-4">
              Something went wrong
            </h2>
            <div className="text-red-800 dark:text-red-200 mb-4">
              <p className="font-semibold mb-2">Error:</p>
              <pre className="bg-white dark:bg-black p-4 rounded overflow-auto text-sm">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>
            {this.state.errorInfo && (
              <div className="text-red-800 dark:text-red-200">
                <p className="font-semibold mb-2">Component Stack:</p>
                <pre className="bg-white dark:bg-black p-4 rounded overflow-auto text-xs">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

