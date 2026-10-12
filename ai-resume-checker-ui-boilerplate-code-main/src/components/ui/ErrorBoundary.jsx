import React, { Component } from "react";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught render error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === "function"
          ? this.props.fallback({ error: this.state.error, reset: this.resetError })
          : this.props.fallback;
      }

      const title = this.props.title || "Unable to display this section";
      const description =
        this.props.description ||
        "The analysis data could not be rendered due to an unexpected or malformed payload. Other sections of the app remain fully functional.";

      return (
        <Card
          role="alert"
          aria-live="assertive"
          className="border-amber-500/30 bg-amber-500/5 p-6 my-4 shadow-sm"
        >
          <div className="flex items-start gap-3.5">
            <div
              className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <AlertTriangle size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-[var(--ink)] leading-snug">
                {title}
              </h3>
              <p className="text-xs text-[var(--ink-muted)] mt-1.5 leading-relaxed">
                {description}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.resetError}
                  className="gap-1.5 text-xs font-medium"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  Try reloading section
                </Button>

                {this.state.error?.message && (
                  <button
                    type="button"
                    onClick={() =>
                      this.setState((s) => ({ showDetails: !s.showDetails }))
                    }
                    className="inline-flex items-center gap-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] rounded"
                  >
                    <span>{this.state.showDetails ? "Hide" : "Show"} technical details</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${
                        this.state.showDetails ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>

              {this.state.showDetails && this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono text-[var(--danger)] overflow-x-auto">
                  {this.state.error.toString()}
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
