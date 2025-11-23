// src/update.ts
import { Auth, ThenUpdate } from "@calpoly/mustang";
import { Msg } from "./messages";
import { Model } from "./model";
import { CarModel, GarageCar } from "@csc437/server/models";

export default function update(
  message: Msg,
  model: Model,
  user: Auth.User
): Model | ThenUpdate<Model, Msg> {
  switch (message[0]) {
    case "car-model/request": {
      const { slug } = message[1];
      // Don't re-fetch if we already have this car model
      if (model.carModel?.slug === slug) break;
      return [
        { ...model, carModel: undefined }, // Clear previous while loading
        requestCarModel({ slug }, user).then((carModel) => [
          "car-model/load",
          { slug, carModel },
        ]),
      ];
    }
    case "car-model/load": {
      const { carModel } = message[1];
      return { ...model, carModel };
    }
    case "garage/request": {
      // Always fetch garage cars to ensure fresh data
      return [
        model,
        requestGarage(user).then((cars) => ["garage/load", { cars }]),
      ];
    }
    case "garage/load": {
      const { cars } = message[1];
      return { ...model, garageCars: cars };
    }
    case "garage/save": {
      const { car } = message[1];
      const { onSuccess, onFailure } = message[2] || {};
      return [
        model,
        saveGarageCar(car, user, { onSuccess, onFailure }).then((savedCar) => [
          "garage/saved",
          { car: savedCar },
        ]),
      ];
    }
    case "garage/saved": {
      const { car } = message[1];
      const existing = model.garageCars || [];
      // Update if exists, otherwise add
      const updated = existing.some((c) => c._id === car._id)
        ? existing.map((c) => (c._id === car._id ? car : c))
        : [...existing, car];
      return { ...model, garageCars: updated };
    }
    case "garage/delete": {
      const { id } = message[1];
      return [
        model,
        deleteGarageCar(id, user).then(() => ["garage/deleted", { id }]),
      ];
    }
    case "garage/deleted": {
      const { id } = message[1];
      const existing = model.garageCars || [];
      return {
        ...model,
        garageCars: existing.filter((c) => c._id !== id),
      };
    }
    default:
      const unhandled: never = message[0];
      throw new Error(`Unhandled Store message "${unhandled}"`);
  }
  return model;
}

// Helper functions for API requests

function requestCarModel(
  payload: { slug: string },
  user: Auth.User
): Promise<CarModel> {
  return fetch(`/api/cars/${payload.slug}`, {
    headers: Auth.headers(user),
  })
    .then((response: Response) => {
      if (response.status === 200) return response.json();
      throw new Error(`Failed to fetch car model: ${response.status}`);
    })
    .then((json: unknown) => {
      if (json) return json as CarModel;
      throw new Error("No JSON in response from server");
    });
}

function requestGarage(user: Auth.User): Promise<GarageCar[]> {
  return fetch("/api/garage", {
    headers: Auth.headers(user),
  })
    .then((response: Response) => {
      if (response.status === 200) return response.json();
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error(`Failed to fetch garage: ${response.status}`);
    })
    .then((json: unknown) => {
      if (Array.isArray(json)) return json as GarageCar[];
      throw new Error("No array in response from server");
    });
}

function saveGarageCar(
  car: GarageCar,
  user: Auth.User,
  callbacks?: { onSuccess?: () => void; onFailure?: (err: Error) => void }
): Promise<GarageCar> {
  const url = car._id ? `/api/garage/${car._id}` : "/api/garage";
  const method = car._id ? "PUT" : "POST";

  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...Auth.headers(user),
    },
    body: JSON.stringify(car),
  })
    .then((response: Response) => {
      if (response.status === 200 || response.status === 201) {
        return response.json();
      }
      throw new Error(`Failed to save garage car: ${response.status}`);
    })
    .then((json: unknown) => {
      if (json) {
        if (callbacks?.onSuccess) callbacks.onSuccess();
        return json as GarageCar;
      }
      throw new Error("No JSON in response from server");
    })
    .catch((err) => {
      if (callbacks?.onFailure) callbacks.onFailure(err as Error);
      throw err;
    });
}

function deleteGarageCar(id: string, user: Auth.User): Promise<void> {
  return fetch(`/api/garage/${id}`, {
    method: "DELETE",
    headers: Auth.headers(user),
  }).then((response: Response) => {
    if (response.status === 200 || response.status === 204) {
      return;
    }
    throw new Error(`Failed to delete garage car: ${response.status}`);
  });
}
