// src/models/garage-car.ts
export interface GarageCar {
  _id?: string;
  username: string;
  modelSlug: string;
  modelName: string;
  nickname: string;
  year: number;
  trim: string;
  mileage?: number;
  notes: string;
  dateAdded?: Date;
}
