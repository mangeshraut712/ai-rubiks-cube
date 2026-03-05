import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unexpected error" };
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
            <h1 className="text-2xl font-bold text-[#1a73e8]">Frontend recovered with fallback</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5f6368]">
              A runtime error interrupted the UI. Reload to continue your session.
            </p>
            <p className="mt-3 rounded-lg bg-[#f1f6ff] px-3 py-2 font-mono text-xs text-[#174ea6]">
              {this.state.errorMessage}
            </p>
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
