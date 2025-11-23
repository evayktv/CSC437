// src/messages.ts
import { CarModel, GarageCar } from "@csc437/server/models";

// Messages dispatched from Views
export type Msg =
  | ["car-model/request", { slug: string }]
  | ["garage/request", {}]
  | ["garage/save", { car: GarageCar }]
  | ["garage/delete", { id: string }]
  | Cmd;

// Internal messages (only invoked from update function)
type Cmd =
  | ["car-model/load", { slug: string; carModel: CarModel }]
  | ["garage/load", { cars: GarageCar[] }]
  | ["garage/saved", { car: GarageCar }]
  | ["garage/deleted", { id: string }];
