import { Button, provideVSCodeDesignSystem, vsCodeButton, vsCodeDivider, Divider } from "@vscode/webview-ui-toolkit";
import React = require("react");
import { createRoot } from 'react-dom/client';
import App from "./App";
import { getVSCodeAPI } from "./vscode";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDivider());
window.addEventListener("load", main);


function main() {
  const app = document.getElementById("react");
  if (app) {
    const root = createRoot(app);
    root.render(<App/>);
  }
}