// src/index.ts
import express, { Request, Response } from "express";
import { connect } from "./services/mongo";
import carsRouter from "./routes/cars";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "../proto/dist";

// Serve static files from proto
app.use(express.static(staticDir));

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount API routers
app.use("/api/cars", carsRouter);

// Health check endpoint
app.get("/hello", (_req: Request, res: Response) => {
  res.send("Hello, World");
});

// Connect to MongoDB
connect("car_catalog");

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${staticDir}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   GET    /hello`);
  console.log(`   GET    /api/cars`);
  console.log(`   GET    /api/cars/:slug`);
  console.log(`   POST   /api/cars`);
  console.log(`   PUT    /api/cars/:slug`);
  console.log(`   DELETE /api/cars/:slug`);
});
