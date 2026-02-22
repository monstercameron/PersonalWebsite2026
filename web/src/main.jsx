import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui.jsx";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("app_error_boundary", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#050505",
            color: "#ededed",
            padding: "24px"
          }}
        >
          <section
            style={{
              width: "min(560px, 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              background: "rgba(20,20,20,0.7)",
              padding: "24px"
            }}
          >
            <p style={{ margin: 0, color: "#fef08a", fontWeight: 600, letterSpacing: "0.04em" }}>APPLICATION ERROR</p>
            <h1 style={{ margin: "8px 0 12px", fontSize: "1.4rem" }}>Something went wrong.</h1>
            <p style={{ margin: 0, color: "#a1a1aa" }}>
              A runtime error interrupted rendering. Refresh the page to retry.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: "#ededed",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
