import express from "express";
import { registerRoutes } from "./routes.js";
import path from "path";

const app = express();
app.use(express.json());

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(process.cwd(), "dist/client")));
  
  // Serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(process.cwd(), "dist/client/index.html"));
  });
}

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.log(`Error ${status}: ${message}`);
  res.status(status).json({ message });
});

// Start server
const port = Number(process.env.PORT) || 5000;
const server = await registerRoutes(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
