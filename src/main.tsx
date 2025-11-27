import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Correct imports — ONLY these two are needed
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById("root")!).render(<App />);
