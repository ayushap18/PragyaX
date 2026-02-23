"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary (${this.props.name || "Unknown"}):`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
          <h2 className="text-lg font-bold mb-2">Component Error</h2>
          <p className="text-sm opacity-80 mb-2">
            {this.props.name ? `Error in ${this.props.name}` : "Something went wrong."}
          </p>
          <button
            className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-xs font-mono uppercase tracking-wider"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
