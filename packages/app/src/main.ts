import { Auth, define, History, Switch, Store } from "@calpoly/mustang";
import { html } from "lit";
import { Msg } from "./messages";
import { Model, init } from "./model";
import update from "./update";
import { ThrottleHeaderElement } from "./components/throttle-header";
import { CarCatalogElement } from "./components/car-catalog";
import { CarModelCardElement } from "./components/car-model-card";
import { CarModelDetailElement } from "./components/car-model-detail";
import { LoginFormElement } from "./components/login-form";
import { GarageCatalogElement } from "./components/garage-catalog";
import { GarageCarFormElement } from "./components/garage-car-form";
import { HomeViewElement } from "./views/home-view";
import { CarModelDetailViewElement } from "./views/car-model-detail-view";
import { LoginViewElement } from "./views/login-view";
import { GarageViewElement } from "./views/garage-view";

const routes: Switch.Route[] = [
  {
    path: "/app/models/:slug",
    view: (params: Switch.Params) =>
      html`<car-model-detail-view slug=${params.slug}></car-model-detail-view>`,
    auth: "public" as const,
  },
  {
    path: "/app/garage",
    view: () => html`<garage-view></garage-view>`,
    auth: "protected" as const,
  },
  {
    path: "/app/login",
    view: () => html`<login-view></login-view>`,
    auth: "public" as const,
  },
  {
    path: "/app",
    view: () => html`<home-view></home-view>`,
    auth: "public" as const,
  },
  {
    path: "/",
    redirect: "/app",
  },
];

define({
  "mu-auth": Auth.Provider,
  "mu-history": History.Provider,
  "mu-store": class AppStore extends Store.Provider<Model, Msg> {
    constructor() {
      super(update, init, "throttle:auth");
    }
  },
  "mu-switch": class AppSwitch extends Switch.Element {
    constructor() {
      super(routes, "throttle:history", "throttle:auth");
    }
  },
  "throttle-header": ThrottleHeaderElement,
  "car-catalog": CarCatalogElement,
  "car-model-card": CarModelCardElement,
  "car-model-detail": CarModelDetailElement,
  "car-model-detail-view": CarModelDetailViewElement,
  "login-form": LoginFormElement,
  "login-view": LoginViewElement,
  "garage-catalog": GarageCatalogElement,
  "garage-car-form": GarageCarFormElement,
  "garage-view": GarageViewElement,
  "home-view": HomeViewElement,
});
