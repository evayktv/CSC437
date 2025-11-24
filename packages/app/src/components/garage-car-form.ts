import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth, Observer, View } from "@calpoly/mustang";
import { GarageCar } from "@csc437/server/models";
import { Msg } from "../messages";
import { Model } from "../model";

export interface GarageCarFormData {
  id?: string;
  modelSlug: string;
  modelName: string;
  nickname: string;
  year: number;
  trim: string;
  mileage?: number;
}

interface CarModel {
  slug: string;
  name: string;
  trims: Array<{ name: string }>;
}

export class GarageCarFormElement extends View<Model, Msg> {
  @property({ type: String })
  mode: "create" | "edit" = "create";

  @property({ type: Object })
  carData?: GarageCarFormData;

  @state()
  private errorMessage: string | null = null;

  @state()
  private availableModels: CarModel[] = [];

  @state()
  private selectedModel: CarModel | null = null;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  constructor() {
    super("throttle:model");
  }

  async connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });

    // Load available models
    try {
      const response = await fetch("/api/cars");
      if (response.ok) {
        this.availableModels = await response.json();

        // If editing or pre-populated, fetch full model details with trims
        if (this.carData?.modelSlug) {
          const detailsResponse = await fetch(
            `/api/cars/${this.carData.modelSlug}`
          );
          if (detailsResponse.ok) {
            const fullModel = await detailsResponse.json();
            this.selectedModel = {
              slug: fullModel.slug,
              name: fullModel.name,
              trims: fullModel.trims || [],
            };
          }
        }
      }
    } catch (error) {
      console.error("Failed to load models:", error);
    }

    // Hide the default submit button after form renders
    setTimeout(() => this.hideDefaultSubmitButton(), 100);
  }

  firstUpdated() {
    // Hide the default submit button after first render
    setTimeout(() => this.hideDefaultSubmitButton(), 100);
  }

  updated() {
    // Hide the default submit button after each update
    setTimeout(() => this.hideDefaultSubmitButton(), 100);
  }

  hideDefaultSubmitButton() {
    // Use requestAnimationFrame to ensure the form is rendered
    requestAnimationFrame(() => {
      const form = this.shadowRoot?.querySelector("mu-form");
      if (form) {
        // Try to access shadow DOM
        const shadowRoot = (form as any).shadowRoot;
        if (shadowRoot) {
          const submitButton = shadowRoot.querySelector(
            'button[type="submit"]'
          );
          if (submitButton) {
            (submitButton as HTMLElement).style.display = "none";
            (submitButton as HTMLElement).style.visibility = "hidden";
            (submitButton as HTMLElement).style.height = "0";
            (submitButton as HTMLElement).style.padding = "0";
            (submitButton as HTMLElement).style.margin = "0";
          }
        }
        // Also try light DOM (in case button is not in shadow)
        const lightSubmitButton = form.querySelector('button[type="submit"]');
        if (lightSubmitButton) {
          (lightSubmitButton as HTMLElement).style.display = "none";
          (lightSubmitButton as HTMLElement).style.visibility = "hidden";
          (lightSubmitButton as HTMLElement).style.height = "0";
          (lightSubmitButton as HTMLElement).style.padding = "0";
          (lightSubmitButton as HTMLElement).style.margin = "0";
        }
      }
    });
  }

  private async handleModelChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const modelSlug = select.value;

    if (!modelSlug) {
      this.selectedModel = null;
      return;
    }

    // Fetch full model details including trims
    try {
      const response = await fetch(`/api/cars/${modelSlug}`);
      if (response.ok) {
        const fullModel = await response.json();
        this.selectedModel = {
          slug: fullModel.slug,
          name: fullModel.name,
          trims: fullModel.trims || [],
        };
      }
    } catch (error) {
      console.error("Failed to load model details:", error);
      this.selectedModel =
        this.availableModels.find((m) => m.slug === modelSlug) || null;
    }
  }

  handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.errorMessage = null;

    if (!this._user.authenticated) {
      this.errorMessage = "Authentication required. Please log in.";
      return;
    }

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Extract and validate required fields
    const modelSlug = formData.get("modelSlug")?.toString() || "";
    const nickname = formData.get("nickname")?.toString() || "";
    const yearValue = formData.get("year");
    const trimValue = formData.get("trim")?.toString() || "";
    const mileageValue = formData.get("mileage");

    // Validate required fields
    if (!modelSlug) {
      this.errorMessage = "Please select a model";
      return;
    }
    if (!nickname) {
      this.errorMessage = "Please enter a nickname";
      return;
    }
    if (!yearValue) {
      this.errorMessage = "Please enter a year";
      return;
    }
    if (!trimValue) {
      this.errorMessage = "Please select or enter a trim";
      return;
    }

    // Convert year to number
    let year: number;
    if (typeof yearValue === "string") {
      year = parseInt(yearValue, 10);
      if (isNaN(year)) {
        this.errorMessage = "Please enter a valid year";
        return;
      }
    } else if (typeof yearValue === "number") {
      year = yearValue;
    } else {
      this.errorMessage = "Please enter a valid year";
      return;
    }

    // Convert mileage to number if provided
    let mileage: number | undefined;
    if (mileageValue) {
      if (typeof mileageValue === "string") {
        mileage = parseInt(mileageValue, 10);
        if (isNaN(mileage)) {
          mileage = undefined;
        }
      } else if (typeof mileageValue === "number") {
        mileage = mileageValue;
      }
    }

    // Build garage car object
    const garageCar: GarageCar = {
      modelSlug,
      modelName: this.selectedModel?.name || "",
      nickname,
      year,
      trim: trimValue,
      mileage,
      username: this._user.username || "",
    };

    // If editing, include the _id
    if (this.mode === "edit" && this.carData?.id) {
      garageCar._id = this.carData.id;
    }

    console.log("Sending garage car:", garageCar);

    this.dispatchMessage([
      "garage/save",
      { car: garageCar },
      {
        onSuccess: () => {
          this.dispatchEvent(new CustomEvent("save-success"));
          this.handleClose();
        },
        onFailure: (err: Error) => {
          this.errorMessage = err.message || "Failed to save vehicle";
          console.error("Error saving garage car:", err);
        },
      },
    ]);
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  render() {
    return html`
      <div class="modal-overlay" @click=${this.handleClose}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <h2>
            ${this.mode === "create" ? "Add Vehicle to Garage" : "Edit Vehicle"}
          </h2>
          ${this.errorMessage
            ? html`<div class="error-message">${this.errorMessage}</div>`
            : ""}

          <form id="garage-car-form" @submit=${this.handleSubmit}>
            <label>
              <span>Select Model *</span>
              <select
                name="modelSlug"
                required
                @change=${this.handleModelChange}
                ?disabled=${this.mode === "edit"}
              >
                <option value="">Choose a model...</option>
                ${this.availableModels.map(
                  (model) => html`
                    <option
                      value="${model.slug}"
                      ?selected=${this.carData?.modelSlug === model.slug}
                    >
                      ${model.name}
                    </option>
                  `
                )}
              </select>
            </label>

            <label>
              <span>Nickname *</span>
              <input
                type="text"
                name="nickname"
                required
                .value=${this.carData?.nickname || ""}
                placeholder="e.g., Daily Driver, Weekend Warrior"
              />
            </label>

            <label>
              <span>Year *</span>
              <input
                type="number"
                name="year"
                required
                min="1900"
                max="${new Date().getFullYear() + 1}"
                .value=${this.carData?.year?.toString() ||
                new Date().getFullYear().toString()}
              />
            </label>

            <label>
              <span>Trim *</span>
              ${this.selectedModel && this.selectedModel.trims.length > 0
                ? html`
                    <select name="trim" required>
                      <option value="">Select trim...</option>
                      ${this.selectedModel.trims.map(
                        (trim) => html`
                          <option
                            value="${trim.name}"
                            ?selected=${this.carData?.trim === trim.name}
                          >
                            ${trim.name}
                          </option>
                        `
                      )}
                    </select>
                  `
                : html`
                    <input
                      type="text"
                      name="trim"
                      required
                      .value=${this.carData?.trim || ""}
                      placeholder="e.g., GT, R/T, SS"
                    />
                  `}
            </label>

            <label>
              <span>Mileage (optional)</span>
              <input
                type="number"
                name="mileage"
                min="0"
                .value=${this.carData?.mileage?.toString() || ""}
                placeholder="e.g., 45000"
              />
            </label>

            <div class="form-actions">
              <button
                type="button"
                class="btn-cancel"
                @click=${this.handleClose}
              >
                Cancel
              </button>
              <button type="submit" class="btn-submit">
                ${this.mode === "create" ? "Add Vehicle" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  static styles = css`
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
    }

    .modal-content {
      background: var(--color-bg-card);
      padding: var(--space-2xl);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 90%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--color-border-muted);
    }

    h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: var(--color-text);
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    label span {
      font-weight: 600;
      color: var(--color-text-muted);
      font-size: 0.95rem;
    }

    input,
    textarea,
    select {
      padding: 0.875rem 1.25rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      background: var(--color-bg-card);
      color: var(--color-text);
      font-family: inherit;
      transition: all var(--transition-base);
    }

    input:focus,
    textarea:focus,
    select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
    }

    .form-actions {
      display: flex;
      gap: var(--space-md);
      margin-top: var(--space-xl);
      padding-top: var(--space-lg);
      border-top: 1px solid var(--color-border-muted);
      justify-content: flex-end;
      align-items: stretch;
    }

    .btn-cancel,
    .btn-submit {
      padding: 0.875rem 2rem;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
      min-width: 140px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .btn-cancel {
      background: transparent;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      font-weight: var(--font-weight-medium);
    }

    .btn-cancel:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-border-muted);
    }

    .btn-submit {
      background: var(--color-accent);
      color: var(--color-text-inverted);
      border: none;
      font-weight: var(--font-weight-semibold);
      box-shadow: 0 2px 4px rgba(196, 30, 58, 0.2);
    }

    .btn-submit:hover:not(:disabled) {
      background: #a01828;
      box-shadow: 0 4px 8px rgba(196, 30, 58, 0.3);
      transform: translateY(-1px);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(196, 30, 58, 0.2);
    }

    .btn-submit:disabled {
      background: var(--color-text-muted);
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
    }

    .error-message {
      color: #d32f2f;
      padding: 0.875rem 1.25rem;
      background: rgba(255, 235, 238, 0.8);
      border: 2px solid rgba(239, 154, 154, 0.6);
      border-radius: var(--radius-md);
      text-align: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--fs-300);
      margin-bottom: var(--space-md);
      box-shadow: var(--shadow-sm);
    }

    :host-context(body.dark-mode) .error-message {
      background: rgba(211, 47, 47, 0.15);
      border-color: rgba(239, 154, 154, 0.4);
      color: #ff6b7a;
    }
  `;
}
