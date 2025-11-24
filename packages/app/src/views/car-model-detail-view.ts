import { View } from "@calpoly/mustang";
import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CarModel } from "@csc437/server/models";
import { Msg } from "../messages";
import { Model } from "../model";
import type { GarageCarFormData } from "../components/garage-car-form";

export class CarModelDetailViewElement extends View<Model, Msg> {
  @property({ attribute: "slug" })
  slug?: string;

  @state()
  get carModel(): CarModel | undefined {
    return this.model.carModel;
  }

  @state()
  private showAddForm: boolean = false;

  @state()
  private formCarData?: GarageCarFormData;

  constructor() {
    super("throttle:model");
  }

  connectedCallback() {
    super.connectedCallback();
    // Request car model if slug is already set
    if (this.slug) {
      this.dispatchMessage(["car-model/request", { slug: this.slug }]);
    }

    // Listen for add-to-garage event from car-model-detail
    this.addEventListener(
      "add-to-garage",
      this.handleAddToGarage as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(
      "add-to-garage",
      this.handleAddToGarage as EventListener
    );
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "slug" && oldValue !== newValue && newValue) {
      this.dispatchMessage(["car-model/request", { slug: newValue }]);
    }
  }

  handleAddToGarage = (e: CustomEvent<{ carModel: CarModel }>) => {
    const { carModel } = e.detail;
    this.formCarData = {
      modelSlug: carModel.slug,
      modelName: carModel.name,
      nickname: "",
      year: new Date().getFullYear(),
      trim: carModel.trims?.[0]?.name || "",
      mileage: undefined,
    };
    this.showAddForm = true;
  };

  handleCloseForm = () => {
    this.showAddForm = false;
    this.formCarData = undefined;
  };

  handleSaveSuccess = () => {
    this.showAddForm = false;
    this.formCarData = undefined;
    // Refresh garage list
    this.dispatchMessage(["garage/request", {}]);
    // Optionally navigate to garage page
    // History.dispatch(this, "history/navigate", { href: "/app/garage" });
  };

  render() {
    if (!this.carModel) {
      return html`<p>Loading...</p>`;
    }

    return html`
      <main class="container">
        <car-model-detail .carModel=${this.carModel}></car-model-detail>
        ${this.showAddForm && this.formCarData
          ? html`
              <garage-car-form
                mode="create"
                .carData=${this.formCarData}
                @close=${this.handleCloseForm}
                @save-success=${this.handleSaveSuccess}
              ></garage-car-form>
            `
          : ""}
      </main>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    main.container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  `;
}
