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
  createAppRoute("/part-1", "home"),
  createAppRoute("/part-1/live", "live"),
  createAppRoute("/part-1/multiplayer", "multiplayer"),
  {
    path: "/live",
    loader: async () => redirect("/part-1/live")
  },
  {
    path: "/labs/multiplayer",
    loader: async () => redirect("/part-1/multiplayer")
  },
  {
    path: "/classic",
    loader: async () => redirect("/part-2")
  },
  {
    path: "/part-2",
    loader: async () => redirect("/legacy-2x2-solver/index.html")
  },
  {
    path: "*",
    loader: async () => redirect("/")
  }
]);
