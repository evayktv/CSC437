// src/model.ts
import { CarModel, GarageCar } from "@csc437/server/models";

export interface Model {
  carModel?: CarModel;
  garageCars?: GarageCar[];
}

export const init: Model = {};
