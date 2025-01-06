import React from "react";

export class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  state = { error: null } as { error: Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-red-500">Error: {this.state.error.message}</div>
      );
    }

    return this.props.children;
  }
}
