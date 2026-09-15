import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState((prev) => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Send error to monitoring service if available
    if (window.errorReporter) {
      window.errorReporter({
        error: error.toString(),
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0] px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-[#d79b8b]">
            <div className="mb-4 text-4xl text-center">⚠️</div>

            <h1 className="text-xl font-semibold text-center text-ink mb-2">
              Oops! Something went wrong
            </h1>

            <p className="text-sm text-[#606a5d] text-center mb-4">
              We encountered an unexpected error. Please try refreshing the page or going back.
            </p>

            {process.env.NODE_ENV === "development" && (
              <details className="mb-4 p-3 bg-[#fff4e6] rounded border border-[#d97e3a] text-xs">
                <summary className="font-semibold text-[#8c3e2d] cursor-pointer">
                  Error details (development only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words text-[#5a2915] text-xs overflow-auto max-h-40">
                  {this.state.error?.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-orange text-white font-semibold py-2 px-4 rounded hover:bg-[#d97e3a] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="flex-1 border border-[#e7e5dc] bg-white text-ink font-semibold py-2 px-4 rounded hover:bg-[#fafaf8] transition-colors"
              >
                Go Home
              </button>
            </div>

            {this.state.errorCount > 2 && (
              <p className="mt-4 text-xs text-[#8c3e2d] bg-[#f7e5df] px-3 py-2 rounded">
                Multiple errors detected. Please contact support if the problem persists.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
