// src/services/car-model-svc.ts
import { Schema, model } from "mongoose";
import { CarModel } from "../models/car-model";

const CarModelSchema = new Schema<CarModel>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    icon: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
    years: { type: String, required: true },
    overview: {
      manufacturer: String,
      bodyStyle: String,
      history: String,
    },
    trims: [
      {
        name: String,
        engine: String,
        horsepower: Number,
        torque: Number,
        zeroToSixty: String,
        topSpeed: String,
        years: String,
      },
    ],
    modifications: [
      {
        name: String,
        type: String,
        hpGain: String,
        costRange: String,
        install: String,
      },
    ],
    history: [String],
  },
  {
    collection: "cars",
  }
);

const CarModelDoc = model<CarModel>("CarModel", CarModelSchema);

function index(): Promise<CarModel[]> {
  return CarModelDoc.find().exec();
}

function get(slug: string): Promise<CarModel | null> {
  return CarModelDoc.findOne({ slug }).exec();
}

function create(carData: CarModel): Promise<CarModel> {
  const car = new CarModelDoc(carData);
  return car.save();
}

function update(slug: string, carData: CarModel): Promise<CarModel> {
  return CarModelDoc.findOneAndUpdate({ slug }, carData, {
    new: true,
  }).then((updated) => {
    if (!updated) throw `${slug} not updated`;
    else return updated as CarModel;
  });
}

function remove(slug: string): Promise<void> {
  return CarModelDoc.findOneAndDelete({ slug }).then((deleted) => {
    if (!deleted) throw `${slug} not deleted`;
  });
}

export default { index, get, create, update, remove };
