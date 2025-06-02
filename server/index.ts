import express from "express";
import { registerRoutes } from "./routes.js";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static("dist/public"));
app.use(express.static("client"));

// API routes
await registerRoutes(app);

// Serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.resolve("client/index.html"));
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
