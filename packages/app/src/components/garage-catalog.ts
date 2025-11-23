import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth, History, Observer } from "@calpoly/mustang";
import { GarageCar } from "@csc437/server/models";
import type { GarageCarFormData } from "./garage-car-form";

export class GarageCatalogElement extends LitElement {
  @property({ type: Array })
  cars: Array<GarageCar> = [];

  @state()
  private showForm: boolean = false;

  @state()
  private formMode: "create" | "edit" = "create";

  @state()
  private editingCar?: GarageCarFormData;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });

    // Check for add query param
    const params = new URLSearchParams(window.location.search);
    const addModelSlug = params.get("add");
    if (addModelSlug) {
      // Pre-populate form with model
      this.handleAddFromModel(addModelSlug);
      // Remove query param using History.dispatch
      History.dispatch(this, "history/navigate", {
        href: window.location.pathname,
      });
    }
  }

  render() {
    return html`
      <div class="catalog-header">
        <button class="btn-add" @click=${this.handleAdd}>
          ➕ Add Vehicle to Garage
        </button>
      </div>

      ${this.cars.length === 0
        ? html`
            <div class="empty-state">
              <p>No vehicles in your garage yet.</p>
              <p>Add your first vehicle to start tracking!</p>
            </div>
          `
        : html`
            <ul class="grid-cards">
              ${this.cars.map(
                (car) => html`
                  <li class="car-card">
                    <article class="garage-card">
                      <h3>${car.nickname}</h3>
                      <p class="model">${car.modelName}</p>
                      <dl>
                        <dt>Year:</dt>
                        <dd>${car.year}</dd>
                        <dt>Trim:</dt>
                        <dd>${car.trim}</dd>
                        ${car.mileage
                          ? html`
                              <dt>Mileage:</dt>
                              <dd>${car.mileage.toLocaleString()} mi</dd>
                            `
                          : ""}
                      </dl>
                    </article>
                    <div class="card-actions">
                      <button
                        class="btn-icon btn-edit"
                        @click=${() => this.handleEdit(car)}
                        title="Edit vehicle"
                      >
                        ✏️
                      </button>
                      <button
                        class="btn-icon btn-delete"
                        @click=${() => this.handleDelete(car)}
                        title="Remove from garage"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                `
              )}
            </ul>
          `}
      ${this.showForm
        ? html`
            <garage-car-form
              .mode=${this.formMode}
              .carData=${this.editingCar}
              @close=${this.handleCloseForm}
              @save-success=${this.handleSaveSuccess}
            ></garage-car-form>
          `
        : ""}
    `;
  }

  async handleAddFromModel(modelSlug: string) {
    // Fetch model details
    try {
      const response = await fetch(`/api/cars/${modelSlug}`);
      if (!response.ok) throw new Error("Model not found");
      const model = await response.json();

      this.formMode = "create";
      this.editingCar = {
        modelSlug: model.slug,
        modelName: model.name,
        nickname: "",
        year: new Date().getFullYear(),
        trim: model.trims?.[0]?.name || "",
        mileage: undefined,
        notes: "",
      };
      this.showForm = true;
    } catch (error) {
      console.error("Error loading model:", error);
      alert("Failed to load model details");
    }
  }

  handleAdd() {
    this.formMode = "create";
    this.editingCar = undefined;
    this.showForm = true;
  }

  handleEdit(car: GarageCar) {
    this.formMode = "edit";
    this.editingCar = {
      id: car._id || "",
      modelSlug: car.modelSlug,
      modelName: car.modelName,
      nickname: car.nickname,
      year: car.year,
      trim: car.trim,
      mileage: car.mileage,
      notes: car.notes || "",
    };
    this.showForm = true;
  }

  handleDelete(car: GarageCar) {
    if (!confirm(`Remove "${car.nickname}" from your garage?`)) {
      return;
    }

    // Dispatch custom event to parent view to handle deletion
    this.dispatchEvent(
      new CustomEvent("garage-delete", {
        detail: { id: car._id },
        bubbles: true,
        composed: true,
      })
    );
  }

  handleCloseForm() {
    this.showForm = false;
    this.editingCar = undefined;
  }

  handleSaveSuccess() {
    // Dispatch custom event to parent view to refresh data
    this.dispatchEvent(
      new CustomEvent("garage-refresh", {
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = css`
    :host {
      display: block;
    }

    .catalog-header {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: flex-end;
    }

    .btn-add {
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

    .btn-add::before {
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

    .btn-add:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.4);
    }

    .btn-add:hover::before {
      width: 300px;
      height: 300px;
    }

    .btn-add:active {
      transform: translateY(0);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-2xl) var(--space-lg);
      color: var(--color-text-muted);
      background: var(--color-bg-card);
      border: 2px dashed var(--color-border-muted);
      border-radius: var(--radius-lg);
      margin: var(--space-xl) 0;
    }

    .empty-state p {
      margin: var(--space-sm) 0;
      font-size: var(--fs-400);
      line-height: 1.6;
    }

    .empty-state p:first-child {
      font-size: var(--fs-500);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
    }

    ul.grid-cards {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--grid-gap);
      list-style: none;
      padding: 0;
      margin: 0;
    }

    @media (min-width: 768px) {
      ul.grid-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      ul.grid-cards {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    li.car-card {
      display: block;
      position: relative;
    }

    .garage-card {
      padding: var(--space-xl);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      background: var(--color-bg-card);
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;
    }

    .garage-card::before {
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

    li.car-card:hover .garage-card {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }

    li.car-card:hover .garage-card::before {
      transform: scaleX(1);
    }

    .garage-card h3 {
      margin: 0 0 var(--space-sm) 0;
      font-size: var(--fs-600);
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }

    .garage-card .model {
      font-size: var(--fs-400);
      color: var(--color-text-muted);
      margin-bottom: var(--space-md);
      font-weight: 500;
    }

    .garage-card dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--space-sm) var(--space-md);
      font-size: var(--fs-300);
    }

    .garage-card dt {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
    }

    .garage-card dd {
      margin: 0;
      color: var(--color-text);
      font-weight: var(--font-weight-regular);
    }

    .card-actions {
      position: absolute;
      top: var(--space-md);
      right: var(--space-md);
      display: flex;
      gap: var(--space-sm);
      opacity: 0;
      transition: all var(--transition-base);
      transform: translateY(-4px);
    }

    li.car-card:hover .card-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .btn-icon {
      width: 2.75rem;
      height: 2.75rem;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1.1rem;
      cursor: pointer;
      background: var(--color-bg-card);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all var(--transition-base);
      backdrop-filter: blur(10px);
    }

    .btn-icon:hover {
      transform: scale(1.1);
      box-shadow: var(--shadow-lg);
    }

    .btn-edit:hover {
      background: rgba(255, 193, 7, 0.15);
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    }

    .btn-delete:hover {
      background: rgba(244, 67, 54, 0.15);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    }

    :host-context(body.dark-mode) .btn-edit:hover {
      background: rgba(255, 193, 7, 0.25);
    }

    :host-context(body.dark-mode) .btn-delete:hover {
      background: rgba(244, 67, 54, 0.25);
    }
  `;
}
