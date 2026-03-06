import React from "react";
import { createBrowserRouter, redirect } from "react-router-dom";

import App from "./App.jsx";
import { fetchRuntimeInfo } from "./utils/runtimeApi.js";

function createAppRoute(path, routeView) {
  return {
    path,
    loader: fetchRuntimeInfo,
    element: <App routeView={routeView} />
  };
}

export const router = createBrowserRouter([
  createAppRoute("/", "home"),
  createAppRoute("/live", "live"),
  createAppRoute("/labs/multiplayer", "multiplayer"),
  {
    path: "/classic",
    loader: async () => redirect("/legacy-2x2-solver/index.html")
  },
  {
    path: "*",
    loader: async () => redirect("/")
  }
]);
