import { View } from "@calpoly/mustang";
import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { CarModel } from "@csc437/server/models";
import { Msg } from "../messages";
import { Model } from "../model";

export class CarModelDetailViewElement extends View<Model, Msg> {
  @property({ attribute: "slug" })
  slug?: string;

  @state()
  get carModel(): CarModel | undefined {
    return this.model.carModel;
  }

  constructor() {
    super("throttle:model");
  }

  connectedCallback() {
    super.connectedCallback();
    // Request car model if slug is already set
    if (this.slug) {
      this.dispatchMessage(["car-model/request", { slug: this.slug }]);
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "slug" && oldValue !== newValue && newValue) {
      this.dispatchMessage(["car-model/request", { slug: newValue }]);
    }
  }

  render() {
    if (!this.carModel) {
      return html`<p>Loading...</p>`;
    }

    return html`
      <main class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/app">Models</a> ▸
          <strong>${this.carModel.name}</strong>
        </nav>
        <car-model-detail .carModel=${this.carModel}></car-model-detail>
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

    nav.breadcrumb {
      margin-bottom: 1rem;
    }

    nav.breadcrumb a {
      color: var(--color-accent, #c41e3a);
      text-decoration: none;
    }

    nav.breadcrumb a:hover {
      text-decoration: underline;
    }
  `;
}
