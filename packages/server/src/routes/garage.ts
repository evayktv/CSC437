// src/routes/garage.ts
import express, { Request, Response } from "express";
import { GarageCar, ServiceLog } from "../models/garage-car";
import GarageCars from "../services/garage-car-svc";

const router = express.Router();

// Get all garage cars for the authenticated user
router.get("/", async (req: Request, res: Response) => {
  try {
    const username = (req as any).user?.username;
    if (!username) {
      return res.status(401).send("Unauthorized");
    }

    const cars = await GarageCars.indexByUser(username);
    res.json(cars);
  } catch (err) {
    console.error("Error fetching garage cars:", err);
    res.status(500).send("Failed to load garage cars");
  }
});

// Add service log to a garage car
// IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
router.post("/:id/service-logs", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username;

    if (!username) {
      return res.status(401).send("Unauthorized");
    }

    // Verify ownership
    const existingCar = await GarageCars.get(id);
    if (!existingCar) {
      return res.status(404).send("Garage car not found");
    }
    if (existingCar.username !== username) {
      return res.status(403).send("Forbidden");
    }

    const serviceLogData = req.body;

    // Validate required fields
    if (!serviceLogData.service || !serviceLogData.service.trim()) {
      return res.status(400).send("Service description is required");
    }

    // Convert date string to Date object if needed
    let serviceDate: Date;
    if (serviceLogData.date) {
      serviceDate = new Date(serviceLogData.date);
      if (isNaN(serviceDate.getTime())) {
        return res.status(400).send("Invalid date format");
      }
    } else {
      serviceDate = new Date();
    }

    const serviceLog: ServiceLog = {
      date: serviceDate,
      service: serviceLogData.service.trim(),
      mileage: serviceLogData.mileage
        ? Number(serviceLogData.mileage)
        : undefined,
      cost: serviceLogData.cost ? Number(serviceLogData.cost) : undefined,
      notes: serviceLogData.notes ? serviceLogData.notes.trim() : undefined,
    };

    const serviceLogs = existingCar.serviceLogs || [];
    serviceLogs.push(serviceLog);

    // Update only the serviceLogs field using $set
    const updatedCar = await GarageCars.update(id, {
      serviceLogs,
    } as Partial<GarageCar>);

    res.json(updatedCar);
  } catch (err: any) {
    console.error("Error adding service log:", err);
    res.status(500).send(`Failed to add service log: ${err.message}`);
  }
});

// Get a specific garage car by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const car = await GarageCars.get(id);

    if (!car) {
      return res.status(404).send(`Garage car "${id}" not found`);
    }

    // Verify ownership
    const username = (req as any).user?.username;
    if (car.username !== username) {
      return res.status(403).send("Forbidden");
    }

    res.json(car);
  } catch (err) {
    console.error("Error fetching garage car:", err);
    res.status(500).send("Failed to load garage car");
  }
});

// Create a new garage car
router.post("/", async (req: Request, res: Response) => {
  try {
    const username = (req as any).user?.username;
    if (!username) {
      return res.status(401).send("Unauthorized");
    }

    const newCar = { ...req.body, username } as GarageCar;
    const createdCar = await GarageCars.create(newCar);
    res.status(201).json(createdCar);
  } catch (err: any) {
    console.error("Error creating garage car:", err);
    res.status(500).send(`Failed to create garage car: ${err.message}`);
  }
});

// Update a garage car
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username;

    // First, verify ownership
    const existingCar = await GarageCars.get(id);
    if (!existingCar) {
      return res.status(404).send("Garage car not found");
    }
    if (existingCar.username !== username) {
      return res.status(403).send("Forbidden");
    }

    const updatedCarData = { ...req.body, username } as GarageCar;
    const updatedCar = await GarageCars.update(id, updatedCarData);
    res.json(updatedCar);
  } catch (err: any) {
    console.error("Error updating garage car:", err);
    res.status(404).send(`Failed to update garage car: ${err.message}`);
  }
});

// Delete a garage car
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const username = (req as any).user?.username;

    // First, verify ownership
    const existingCar = await GarageCars.get(id);
    if (!existingCar) {
      return res.status(404).send("Garage car not found");
    }
    if (existingCar.username !== username) {
      return res.status(403).send("Forbidden");
    }

    await GarageCars.remove(id);
    res.status(204).end();
  } catch (err: any) {
    console.error("Error deleting garage car:", err);
    res.status(404).send(`Failed to delete garage car: ${err.message}`);
  }
});

export default router;
