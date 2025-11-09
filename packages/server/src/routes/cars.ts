// src/routes/cars.ts
import express, { Request, Response } from "express";
import { CarModel } from "../models/car-model";
import CarModels from "../services/car-model-svc";

const router = express.Router();

// GET /api/cars - List all cars (catalog view)
router.get("/", (_req: Request, res: Response) => {
  CarModels.index()
    .then((models: CarModel[]) => {
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
    })
    .catch((err) => {
      console.error("Error fetching cars:", err);
      res.status(500).send("Failed to load cars");
    });
});

// GET /api/cars/:slug - Get detailed car model by slug
router.get("/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;

  CarModels.get(slug)
    .then((model: CarModel | null) => {
      if (!model) {
        return res.status(404).send(`Car "${slug}" not found`);
      }
      res.json(model);
    })
    .catch((err) => {
      console.error("Error fetching car details:", err);
      res.status(500).send("Failed to load car details");
    });
});

// POST /api/cars - Create new car
router.post("/", (req: Request, res: Response) => {
  const newCar = req.body;

  CarModels.create(newCar)
    .then((car: CarModel) => res.status(201).json(car))
    .catch((err) => {
      console.error("Error creating car:", err);
      res.status(500).send("Failed to create car");
    });
});

// PUT /api/cars/:slug - Update existing car
router.put("/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;
  const updatedCar = req.body;

  CarModels.update(slug, updatedCar)
    .then((car: CarModel) => res.json(car))
    .catch((err) => {
      console.error("Error updating car:", err);
      res.status(404).send(`Car "${slug}" not found or failed to update`);
    });
});

// DELETE /api/cars/:slug - Delete car
router.delete("/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;

  CarModels.remove(slug)
    .then(() => res.status(204).end())
    .catch((err) => {
      console.error("Error deleting car:", err);
      res.status(404).send(`Car "${slug}" not found`);
    });
});

export default router;
