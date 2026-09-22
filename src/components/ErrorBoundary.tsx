import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// React unmounts the whole tree to a blank screen on any uncaught render
// error, with no visible feedback — this makes a "blank screen" bug report
// actually diagnosable by showing what threw instead of showing nothing.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100dvh",
          padding: "24px",
          paddingTop: "max(24px, env(safe-area-inset-top))",
          background: "#1a1a2e",
          color: "#fff",
          fontFamily: "-apple-system, sans-serif",
          overflowY: "auto",
        }}>
          <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Something went wrong</p>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>
            Please screenshot this and send it to the team.
          </p>
          <pre style={{
            fontSize: 12,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "rgba(255,255,255,0.1)",
            padding: 12,
            borderRadius: 8,
          }}>
            {this.state.error.name}: {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
