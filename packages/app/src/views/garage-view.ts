import { css, html } from "lit";
import { state } from "lit/decorators.js";
import { View } from "@calpoly/mustang";
import { Msg } from "../messages";
import { Model } from "../model";
import { GarageCar } from "@csc437/server/models";

export class GarageViewElement extends View<Model, Msg> {
  @state()
  get garageCars(): GarageCar[] {
    return this.model.garageCars || [];
  }

  constructor() {
    super("throttle:model");
  }

  connectedCallback() {
    super.connectedCallback();
    // Request garage cars from store
    this.dispatchMessage(["garage/request", {}]);

    // Listen for delete and refresh events from garage-catalog
    this.addEventListener("garage-delete", this.handleDelete as EventListener);
    this.addEventListener(
      "garage-refresh",
      this.handleRefresh as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener(
      "garage-delete",
      this.handleDelete as EventListener
    );
    this.removeEventListener(
      "garage-refresh",
      this.handleRefresh as EventListener
    );
  }

  handleDelete(event: CustomEvent<{ id: string }>) {
    const { id } = event.detail;
    this.dispatchMessage(["garage/delete", { id }]);
  }

  handleRefresh() {
    this.dispatchMessage(["garage/request", {}]);
  }

  render() {
    return html`
      <main class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/app">Models</a> ▸
          <strong>My Garage</strong>
        </nav>

        <section aria-labelledby="garage">
          <h2 id="garage">Your Vehicles</h2>
          <garage-catalog .cars=${this.garageCars}></garage-catalog>
        </section>
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

    h2 {
      margin-bottom: var(--space-xl);
      font-size: var(--fs-800);
      color: var(--color-text);
      font-weight: var(--font-weight-extrabold);
      letter-spacing: -0.02em;
    }
  `;
}
