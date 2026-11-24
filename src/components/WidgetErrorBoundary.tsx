"use client";
import { Component, type ReactNode } from "react";

/** Keeps one broken widget from taking down the whole dashboard. */
export class WidgetErrorBoundary extends Component<{ name: string; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <div className="text-sm text-negative">
          {this.props.name} crashed: {this.state.error.message}
        </div>
      );
    return this.props.children;
  }
}
