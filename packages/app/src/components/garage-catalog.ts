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

  @state()
  private carImages: Map<string, string> = new Map();

  @state()
  private showDeleteConfirm: boolean = false;

  @state()
  private carToDelete?: GarageCar;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });

    // Listen for popstate events to detect URL changes
    window.addEventListener("popstate", this.checkForAddParam);
    // Also listen for custom navigation events
    window.addEventListener("locationchange", this.checkForAddParam);

    // Check for add query param on mount
    this.checkForAddParam();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this.checkForAddParam);
    window.removeEventListener("locationchange", this.checkForAddParam);
  }

  willUpdate() {
    // Check for add query param before update
    this.checkForAddParam();
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Load images when cars change
    if (changedProperties.has("cars")) {
      this.loadCarImages();
    }
  }

  private checkForAddParam = () => {
    // Only check if form is not already showing
    if (this.showForm) {
      return;
    }

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
  };

  private async loadCarImages() {
    if (!this.cars || this.cars.length === 0) return;

    // Load images for all cars
    const imagePromises = this.cars.map(async (car) => {
      if (this.carImages.has(car._id || "")) return; // Already loaded

      try {
        const response = await fetch(`/api/cars/${car.modelSlug}`);
        if (response.ok) {
          const model = await response.json();
          const image =
            model.images?.trims?.[car.trim] || model.images?.hero || null;
          if (image && car._id) {
            this.carImages.set(car._id, image);
            this.requestUpdate();
          }
        }
      } catch (error) {
        console.error(`Failed to load image for ${car.modelSlug}:`, error);
      }
    });

    await Promise.all(imagePromises);
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
              ${this.cars.map((car) => {
                const image = car._id ? this.carImages.get(car._id) : null;
                return html`
                  <li class="car-card">
                    <article
                      class="garage-card"
                      @click=${(e: Event) => {
                        // Don't navigate if clicking on action buttons
                        if (
                          (e.target as HTMLElement).closest(".card-actions")
                        ) {
                          return;
                        }
                        if (car._id) {
                          History.dispatch(this, "history/navigate", {
                            href: `/app/garage/${car._id}`,
                          });
                        }
                      }}
                    >
                      ${image
                        ? html`
                            <div class="card-image">
                              <img src="${image}" alt="${car.modelName}" />
                            </div>
                          `
                        : ""}
                      <div class="card-content">
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
                      </div>
                    </article>
                    <div class="card-actions">
                      <button
                        class="btn-icon btn-delete"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.handleDelete(car);
                        }}
                        title="Remove from garage"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          ></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </li>
                `;
              })}
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
      ${this.showDeleteConfirm && this.carToDelete
        ? html`
            <div class="modal-overlay" @click=${this.handleCancelDelete}>
              <div
                class="modal-content"
                @click=${(e: Event) => e.stopPropagation()}
              >
                <h2>Remove Vehicle?</h2>
                <p>
                  Are you sure you want to remove
                  <strong>"${this.carToDelete.nickname}"</strong> from your
                  garage? This action cannot be undone.
                </p>
                <div class="modal-actions">
                  <button class="btn-cancel" @click=${this.handleCancelDelete}>
                    Cancel
                  </button>
                  <button
                    class="btn-confirm"
                    @click=${this.handleConfirmDelete}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
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
    };
    this.showForm = true;
  }

  handleDelete(car: GarageCar) {
    this.carToDelete = car;
    this.showDeleteConfirm = true;
  }

  handleConfirmDelete() {
    if (this.carToDelete?._id) {
      // Dispatch custom event to parent view to handle deletion
      this.dispatchEvent(
        new CustomEvent("garage-delete", {
          detail: { id: this.carToDelete._id },
          bubbles: true,
          composed: true,
        })
      );
    }
    this.showDeleteConfirm = false;
    this.carToDelete = undefined;
  }

  handleCancelDelete() {
    this.showDeleteConfirm = false;
    this.carToDelete = undefined;
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
      padding: 0;
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      background: var(--color-bg-card);
      transition: all var(--transition-base);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-image {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--color-bg-hover);
      position: relative;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-base);
    }

    li.car-card:hover .card-image img {
      transform: scale(1.05);
    }

    .card-content {
      padding: var(--space-xl);
      flex: 1;
      display: flex;
      flex-direction: column;
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
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      background: var(--color-bg-card);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
      color: var(--color-text-muted);
    }

    .btn-icon svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .btn-delete:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
      color: #d32f2f;
      background: rgba(244, 67, 54, 0.1);
    }

    :host-context(body.dark-mode) .btn-delete:hover {
      background: rgba(244, 67, 54, 0.2);
      color: #ff6b7a;
    }

    /* Delete Confirmation Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: var(--color-bg-card);
      padding: var(--space-2xl);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 90%;
      max-width: 500px;
      border: 1px solid var(--color-border-muted);
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-content h2 {
      margin: 0 0 var(--space-md) 0;
      font-size: var(--fs-600);
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }

    .modal-content p {
      margin: 0 0 var(--space-xl) 0;
      color: var(--color-text-muted);
      font-size: var(--fs-400);
      line-height: 1.6;
    }

    .modal-content strong {
      color: var(--color-text);
      font-weight: var(--font-weight-semibold);
    }

    .modal-actions {
      display: flex;
      gap: var(--space-md);
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-confirm {
      padding: 0.875rem 2rem;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
      min-width: 120px;
      border: none;
    }

    .btn-cancel {
      background: var(--color-bg-hover);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }

    .btn-cancel:hover {
      background: var(--color-border-muted);
      border-color: var(--color-text-muted);
      transform: translateY(-1px);
    }

    .btn-confirm {
      background: #dc3545;
      color: var(--color-text-inverted);
      box-shadow: 0 4px 14px 0 rgba(220, 53, 69, 0.25);
    }

    .btn-confirm:hover {
      background: #c82333;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(220, 53, 69, 0.35);
    }

    .btn-confirm:active,
    .btn-cancel:active {
      transform: translateY(0);
    }

    :host-context(body.dark-mode) .modal-content {
      background: var(--color-bg-card);
      border-color: var(--color-border);
    }

    :host-context(body.dark-mode) .btn-confirm {
      background: #ff4757;
    }

    :host-context(body.dark-mode) .btn-confirm:hover {
      background: #ff6b7a;
    }
  `;
}
