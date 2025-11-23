// src/routes/cars.ts
import express, { Request, Response } from "express";
import { CarModel } from "../models/car-model";
import CarModels from "../services/car-model-svc";
import { authenticateUser } from "./auth";

const router = express.Router();

// List all cars (catalog view) - NO AUTH REQUIRED
router.get("/", async (_req: Request, res: Response) => {
  try {
    const models = await CarModels.index();
    const catalog = models.map((m) => ({
      slug: m.slug,
      name: m.name,
      category: m.category,
      icon: m.icon,
      href: m.href,
      years: m.years,
      image: m.images?.hero || null,
    }));
    res.json(catalog);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).send("Failed to load cars");
  }
});

// Get detailed car model by slug - NO AUTH REQUIRED
router.get("/:slug", async (req: Request, res: Response) => {
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

// Create a new car - AUTH REQUIRED
router.post("/", authenticateUser, async (req: Request, res: Response) => {
  try {
    const newCar = req.body as CarModel;
    const createdCar = await CarModels.create(newCar);
    res.status(201).json(createdCar);
  } catch (err: any) {
    console.error("Error creating car:", err);
    res.status(500).send(`Failed to create car: ${err.message}`);
  }
});

// Update an existing car - AUTH REQUIRED
router.put("/:slug", authenticateUser, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const updatedCarData = req.body as CarModel;
    const updatedCar = await CarModels.update(slug, updatedCarData);
    res.json(updatedCar);
  } catch (err: any) {
    console.error("Error updating car:", err);
    res.status(404).send(`Failed to update car: ${err.message}`);
  }
});

// Delete a car - AUTH REQUIRED
router.delete(
  "/:slug",
  authenticateUser,
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      await CarModels.remove(slug);
      res.status(204).end();
    } catch (err: any) {
      console.error("Error deleting car:", err);
      res.status(404).send(`Failed to delete car: ${err.message}`);
    }
  }
);

export default router;
