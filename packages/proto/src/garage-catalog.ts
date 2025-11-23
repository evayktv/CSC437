import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth, Observer } from "@calpoly/mustang";
import type { GarageCarFormData } from "./garage-car-form";

interface GarageCar {
  _id: string;
  modelSlug: string;
  modelName: string;
  nickname: string;
  year: number;
  trim: string;
  mileage?: number;
  notes: string;
}

export class GarageCatalogElement extends LitElement {
  @property()
  src?: string;

  @state()
  cars: Array<GarageCar> = [];

  @state()
  private showForm: boolean = false;

  @state()
  private formMode: "create" | "edit" = "create";

  @state()
  private editingCar?: GarageCarFormData;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "my:auth");

  connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
        if (this.src) this.hydrate(this.src);
      }
    });

    // Check for add query param
    const params = new URLSearchParams(window.location.search);
    const addModelSlug = params.get("add");
    if (addModelSlug) {
      // Pre-populate form with model
      this.handleAddFromModel(addModelSlug);
      // Remove query param
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  hydrate(src: string) {
    if (!this._user.authenticated) {
      window.location.href = "/login.html";
      return;
    }

    fetch(src, {
      headers: Auth.headers(this._user),
    })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login.html";
          throw new Error("Unauthorized");
        }
        if (res.ok) {
          return res.json();
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      })
      .then((json: Array<GarageCar>) => {
        this.cars = json;
      })
      .catch((error) => {
        console.error("Error fetching garage cars:", error);
      });
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
      id: car._id,
      modelSlug: car.modelSlug,
      modelName: car.modelName,
      nickname: car.nickname,
      year: car.year,
      trim: car.trim,
      mileage: car.mileage,
      notes: car.notes,
    };
    this.showForm = true;
  }

  async handleDelete(car: GarageCar) {
    if (!confirm(`Remove "${car.nickname}" from your garage?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/garage/${car._id}`, {
        method: "DELETE",
        headers: Auth.headers(this._user),
      });

      if (!response.ok) {
        throw new Error("Failed to delete vehicle");
      }

      // Refresh the list
      if (this.src) this.hydrate(this.src);
    } catch (error) {
      alert("Failed to remove vehicle. Please try again.");
      console.error(error);
    }
  }

  handleCloseForm() {
    this.showForm = false;
    this.editingCar = undefined;
  }

  handleSaveSuccess() {
    // Refresh the list
    if (this.src) this.hydrate(this.src);
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
      padding: 0.75rem 1.5rem;
      background: #c41e3a;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-add:hover {
      background: #a01828;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--color-text-muted, #666);
    }

    .empty-state p {
      margin: 0.5rem 0;
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
      padding: 1.5rem;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 8px;
      background: var(--color-background-card, #fff);
    }

    .garage-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      color: var(--color-text);
    }

    .garage-card .model {
      font-size: 1rem;
      color: var(--color-text-muted, #666);
      margin-bottom: 1rem;
    }

    .garage-card dl {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .garage-card dt {
      font-weight: 600;
    }

    .garage-card dd {
      margin: 0;
    }

    .card-actions {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    li.car-card:hover .card-actions {
      opacity: 1;
    }

    .btn-icon {
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1.2rem;
      cursor: pointer;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .btn-edit:hover {
      background: #fff3cd;
    }

    .btn-delete:hover {
      background: #ffebee;
    }
  `;
}
