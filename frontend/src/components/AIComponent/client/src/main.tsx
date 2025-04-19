import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import { VisualizerProvider } from "./context/VisualizerContext";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="isolate"> {/* Add isolation container */}
      <VisualizerProvider>
        <App />
      </VisualizerProvider>
    </div>
  </StrictMode>
);
