// src/index.ts
import express, { Request, Response } from "express";
import { connect } from "./services/mongo";
import CarModels from "./services/car-model-svc";

const app = express();
const port = process.env.PORT || 3000;
const staticDir = process.env.STATIC || "../proto/dist";

// Serve static files from proto
app.use(express.static(staticDir));

// Health check endpoint
app.get("/hello", (_req: Request, res: Response) => {
  res.send("Hello, World");
});

// List all cars (catalog view)
app.get("/api/cars", async (_req: Request, res: Response) => {
  try {
    const models = await CarModels.index();

    // Return lightweight catalog view
    const catalog = models.map((m) => ({
      slug: m.slug,
      name: m.name,
      category: m.category,
      icon: m.icon,
      href: m.href,
      years: m.years,
    }));

    res.json(catalog);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).send("Failed to load cars");
  }
});

// Get detailed car model by slug
app.get("/api/cars/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const model = await CarModels.get(slug);

    if (!model) {
      return res.status(404).send(`Car "${slug}" not found`);
    }

    res.json(model);
  } catch (err) {
    console.error("Error fetching car details:", err);
    res.status(500).send("Failed to load car details");
  }
});

// Connect to MongoDB
connect("car_catalog");

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${staticDir}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   GET /hello`);
  console.log(`   GET /api/cars`);
  console.log(`   GET /api/cars/:slug`);
});
