// src/services/garage-car-svc.ts
import { Schema, model } from "mongoose";
import { GarageCar, ServiceLog } from "../models/garage-car";

const ServiceLogSchema = new Schema<ServiceLog>(
  {
    date: { type: Date, required: true },
    service: { type: String, required: true, trim: true },
    mileage: { type: Number },
    cost: { type: Number },
    notes: { type: String },
  },
  { _id: true }
);

const GarageCarSchema = new Schema<GarageCar>(
  {
    username: { type: String, required: true, trim: true },
    modelSlug: { type: String, required: true, trim: true },
    modelName: { type: String, required: true, trim: true },
    nickname: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    trim: { type: String, required: true, trim: true },
    mileage: { type: Number },
    notes: { type: String, default: "" },
    dateAdded: { type: Date, default: Date.now },
    serviceLogs: { type: [ServiceLogSchema], default: [] },
  },
  {
    collection: "garage_cars",
  }
);

const GarageCarModel = model<GarageCar>("GarageCar", GarageCarSchema);

// Get all garage cars for a specific user
function indexByUser(username: string): Promise<GarageCar[]> {
  return GarageCarModel.find({ username }).exec();
}

// Get a specific garage car by ID
function get(id: string): Promise<GarageCar | null> {
  return GarageCarModel.findById(id).exec();
}

// Create a new garage car
function create(garageCar: GarageCar): Promise<GarageCar> {
  const newCar = new GarageCarModel(garageCar);
  return newCar.save();
}

// Update a garage car
function update(id: string, garageCar: Partial<GarageCar>): Promise<GarageCar> {
  return GarageCarModel.findByIdAndUpdate(id, garageCar, {
    new: true,
  }).then((updated) => {
    if (!updated) throw `${id} not updated`;
    else return updated as GarageCar;
  });
}

// Delete a garage car
function remove(id: string): Promise<void> {
  return GarageCarModel.findByIdAndDelete(id).then((deleted) => {
    if (!deleted) throw `${id} not deleted`;
  });
}

export default { indexByUser, get, create, update, remove };
