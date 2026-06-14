import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { theme } from "./theme";

const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${theme.colors.bg}; color: ${theme.colors.text}; font-family: ${theme.fonts.sans}; -webkit-font-smoothing: antialiased; }
  a { color: ${theme.colors.accent}; text-decoration: none; }
  input, select, textarea, button { font-family: inherit; }
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
