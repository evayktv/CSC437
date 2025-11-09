import { LitElement, html, css } from "lit";
import { state } from "lit/decorators.js";

interface CarModel {
  slug: string;
  name: string;
  category: string;
  icon: string;
  years: string;
  overview: {
    manufacturer: string;
    bodyStyle: string;
    history: string;
  };
  trims: Array<{
    name: string;
    engine: string;
    horsepower: number;
    torque: number;
    zeroToSixty: string;
    topSpeed: string;
    years: string;
  }>;
  modifications: Array<{
    name: string;
    type: string;
    hpGain: string;
    costRange: string;
    install: string;
  }>;
  history: string[];
}

export class CarModelDetailElement extends LitElement {
  @state()
  car: CarModel | null = null;

  @state()
  loading: boolean = true;

  @state()
  error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadCarData();
  }

  loadCarData() {
    // Get the 'car' parameter from URL (?car=challenger)
    const params = new URLSearchParams(window.location.search);
    const carSlug = params.get("car");

    if (!carSlug) {
      this.error = "No car specified in URL";
      this.loading = false;
      return;
    }

    // Fetch from API
    fetch(`/api/cars/${carSlug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Car "${carSlug}" not found`);
        }
        return res.json();
      })
      .then((data: CarModel) => {
        this.car = data;
        this.loading = false;

        // Update page title
        document.title = `${data.name} • CSC437 Proto`;

        // Update header elements
        const carName = document.getElementById("car-name");
        const carTitle = document.querySelector("#car-title span");
        if (carName) carName.textContent = data.name;
        if (carTitle) carTitle.textContent = data.name;
      })
      .catch((err) => {
        this.error = err.message;
        this.loading = false;
      });
  }

  render() {
    if (this.loading) {
      return html`<p>Loading car details...</p>`;
    }

    if (this.error) {
      return html`<p class="error">Error: ${this.error}</p>`;
    }

    if (!this.car) {
      return html`<p>No car data available</p>`;
    }

    return html`
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading">Overview</h2>
        <dl>
          <dt>Manufacturer:</dt>
          <dd>${this.car.overview.manufacturer}</dd>
          <dt>Body Style:</dt>
          <dd>${this.car.overview.bodyStyle}</dd>
          <dt>History:</dt>
          <dd>${this.car.overview.history}</dd>
          <dt>Years:</dt>
          <dd>${this.car.years}</dd>
        </dl>
      </section>

      <section aria-labelledby="trims-heading">
        <h2 id="trims-heading">Trims</h2>
        <div class="grid-cards">
          ${this.car.trims.map(
            (trim) => html`
              <article class="card">
                <h3>${trim.name}</h3>
                <dl>
                  <dt>Engine:</dt>
                  <dd>${trim.engine}</dd>
                  <dt>Horsepower:</dt>
                  <dd>${trim.horsepower} hp</dd>
                  <dt>Torque:</dt>
                  <dd>${trim.torque} lb-ft</dd>
                  <dt>0-60 mph:</dt>
                  <dd>${trim.zeroToSixty}</dd>
                  <dt>Top Speed:</dt>
                  <dd>${trim.topSpeed}</dd>
                  <dt>Years:</dt>
                  <dd>${trim.years}</dd>
                </dl>
              </article>
            `
          )}
        </div>
      </section>

      ${this.car.modifications && this.car.modifications.length > 0
        ? html`
            <section aria-labelledby="mods-heading">
              <h2 id="mods-heading">Modifications</h2>
              <div class="grid-cards">
                ${this.car.modifications.map(
                  (mod) => html`
                    <article class="card">
                      <h3>${mod.name}</h3>
                      <dl>
                        <dt>Type:</dt>
                        <dd>${mod.type}</dd>
                        <dt>HP Gain:</dt>
                        <dd>${mod.hpGain}</dd>
                        <dt>Cost Range:</dt>
                        <dd>${mod.costRange}</dd>
                        <dt>Installation:</dt>
                        <dd>${mod.install}</dd>
                      </dl>
                    </article>
                  `
                )}
              </div>
            </section>
          `
        : ""}
      ${this.car.history && this.car.history.length > 0
        ? html`
            <section aria-labelledby="history-heading">
              <h2 id="history-heading">History</h2>
              <ul>
                ${this.car.history.map((item) => html`<li>${item}</li>`)}
              </ul>
            </section>
          `
        : ""}
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    section {
      margin-bottom: var(--space-lg, 2rem);
    }

    h2 {
      margin-bottom: var(--space-md, 1rem);
      font-size: var(--fs-500, 1.5rem);
    }

    h3 {
      margin-bottom: var(--space-sm, 0.5rem);
      font-size: var(--fs-400, 1.25rem);
    }

    dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--space-sm, 0.5rem);
    }

    dt {
      font-weight: bold;
    }

    dd {
      margin: 0;
    }

    .grid-cards {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-md, 1rem);
    }

    @media (min-width: 768px) {
      .grid-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .card {
      padding: var(--space-md, 1rem);
      border: 1px solid var(--color-border-muted, #ccc);
      border-radius: 8px;
      background: var(--color-bg-section, #fff);
    }

    ul {
      list-style: disc;
      padding-left: var(--space-lg, 2rem);
    }

    li {
      margin-bottom: var(--space-sm, 0.5rem);
    }

    .error {
      color: red;
      font-weight: bold;
    }
  `;
}
