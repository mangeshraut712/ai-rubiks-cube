import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", errorStack: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unknown error",
      errorStack: error?.stack || ""
    };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Frontend crash:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-[#f8fbff] px-6 py-16 text-[#202124]">
          <div className="mx-auto max-w-xl rounded-2xl border border-[#d9e4f2] bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-[#1a73e8]">⚠️ Error in Application</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5f6368]">
              A runtime error occurred. Please check the console for details.
            </p>
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="font-mono text-xs text-red-600 break-words">
                {this.state.errorMessage}
              </p>
              {this.state.errorStack && (
                <pre className="mt-2 font-mono text-xs text-red-500 overflow-auto max-h-32">
                  {this.state.errorStack.substring(0, 500)}
                </pre>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-lg bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1765cc]"
            >
              Reload App
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
