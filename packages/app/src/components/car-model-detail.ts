import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth, History, Observer } from "@calpoly/mustang";
import { CarModel } from "@csc437/server/models";

export class CarModelDetailElement extends LitElement {
  @property({ type: Object })
  carModel?: CarModel;

  @property()
  slug?: string;

  @state()
  car: CarModel | null = null;

  @state()
  loading: boolean = true;

  @state()
  error: string | null = null;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });

    // If carModel is provided, use it; otherwise load from API
    if (this.carModel) {
      this.car = this.carModel;
      this.loading = false;
    } else {
      this.loadCarData();
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    // If carModel property is set, use it
    if (changedProperties.has("carModel") && this.carModel) {
      this.car = this.carModel;
      this.loading = false;
      this.error = null;
      // Update page title
      document.title = `${this.carModel.name} • Throttle Vault`;
      return;
    }

    // Otherwise, load from API if slug changes
    if (changedProperties.has("slug") && !this.carModel) {
      this.loadCarData();
    }
  }

  loadCarData() {
    // Get slug from property (from route) or fallback to URL param for backwards compatibility
    const carSlug =
      this.slug || new URLSearchParams(window.location.search).get("car");

    if (!carSlug) {
      this.error = "No car specified";
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Fetch from API (no auth needed for GET)
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
        document.title = `${data.name} • Throttle Vault`;
      })
      .catch((err) => {
        this.error = err.message;
        this.loading = false;
      });
  }

  handleAddToGarage() {
    if (!this._user.authenticated) {
      // Redirect to login if not authenticated
      History.dispatch(this, "history/navigate", { href: "/login.html" });
      return;
    }

    // Navigate to garage page with model slug as query param
    const carSlug =
      this.slug || new URLSearchParams(window.location.search).get("car");
    if (carSlug) {
      History.dispatch(this, "history/navigate", {
        href: `/app/garage?add=${carSlug}`,
      });
    }
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
      <div class="action-bar">
        <button class="btn-add-to-garage" @click=${this.handleAddToGarage}>
          🚗 Add to My Garage
        </button>
      </div>

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

    .action-bar {
      margin-bottom: var(--space-lg, 2rem);
      display: flex;
      justify-content: flex-end;
    }

    .btn-add-to-garage {
      padding: 0.875rem 2rem;
      background: var(--color-accent-gradient);
      color: var(--color-text-inverted);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-accent);
      position: relative;
      overflow: hidden;
    }

    .btn-add-to-garage::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    .btn-add-to-garage:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.4);
    }

    .btn-add-to-garage:hover::before {
      width: 300px;
      height: 300px;
    }

    .btn-add-to-garage:active {
      transform: translateY(0);
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
      padding: var(--space-lg);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      background: var(--color-bg-card);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--color-accent-gradient);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--transition-base);
    }

    .card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }

    .card:hover::before {
      transform: scaleX(1);
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
