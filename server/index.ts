import express from "express";
import { registerRoutes } from "./routes.js";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist/public"));
  
  // Serve index.html for non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.resolve("dist/public/index.html"));
  });
}

const port = Number(process.env.PORT) || 5000;
const server = await registerRoutes(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
