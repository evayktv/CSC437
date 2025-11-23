// src/index.ts
import express, { Request, Response } from "express";
import fs from "node:fs/promises";
import path from "path";
import { connect } from "./services/mongo";
import carsRouter from "./routes/cars";
import garageRouter from "./routes/garage";
import authRouter, { authenticateUser } from "./routes/auth";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "../proto/dist";

// Serve static files from proto
app.use(express.static(staticDir));

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount auth router (public routes)
app.use("/auth", authRouter);

// Mount API routers
app.use("/api/cars", carsRouter); // Public GET, protected POST/PUT/DELETE
app.use("/api/garage", authenticateUser, garageRouter); // All routes protected

// Health check endpoint
app.get("/hello", (_req: Request, res: Response) => {
  res.send("Hello, World");
});

// SPA Routes: /app/...
app.use("/app", (req: Request, res: Response) => {
  const indexHtml = path.resolve(staticDir, "index.html");
  fs.readFile(indexHtml, { encoding: "utf8" }).then((html) => res.send(html));
});

// Connect to MongoDB
connect("car_catalog");

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${staticDir}`);
  console.log(`🔗 Auth endpoints:`);
  console.log(`   POST   /auth/register`);
  console.log(`   POST   /auth/login`);
  console.log(`📖 Public API endpoints (Models):`);
  console.log(`   GET    /api/cars`);
  console.log(`   GET    /api/cars/:slug`);
  console.log(`🔒 Protected API endpoints (require authentication):`);
  console.log(`   POST   /api/cars`);
  console.log(`   PUT    /api/cars/:slug`);
  console.log(`   DELETE /api/cars/:slug`);
  console.log(`🚗 Garage API endpoints (require authentication):`);
  console.log(`   GET    /api/garage`);
  console.log(`   GET    /api/garage/:id`);
  console.log(`   POST   /api/garage`);
  console.log(`   PUT    /api/garage/:id`);
  console.log(`   DELETE /api/garage/:id`);
});
