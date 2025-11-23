import { define, Auth } from "@calpoly/mustang";
import { CarModelCardElement } from "./car-model-card";
import { CarCatalogElement } from "./car-catalog";
import { CarModelDetailElement } from "./car-model-detail";
import { LoginFormElement } from "./login-form";
import { CarFormElement } from "./car-form";
import { GarageCatalogElement } from "./garage-catalog";
import { GarageCarFormElement } from "./garage-car-form";
import { AuthStatusElement } from "./auth-status";

define({
  "mu-auth": Auth.Provider,
  "auth-status": AuthStatusElement,
  "car-model-card": CarModelCardElement,
  "car-catalog": CarCatalogElement,
  "car-model-detail": CarModelDetailElement,
  "login-form": LoginFormElement,
  "car-form": CarFormElement,
  "garage-catalog": GarageCatalogElement,
  "garage-car-form": GarageCarFormElement,
});
