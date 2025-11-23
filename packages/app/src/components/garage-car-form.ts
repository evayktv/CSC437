import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth, Form, Observer, View } from "@calpoly/mustang";
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
  notes: string;
}

interface CarModel {
  slug: string;
  name: string;
  trims: Array<{ name: string }>;
}

export class GarageCarFormElement extends View<Model, Msg> {
  static uses = {
    "mu-form": Form.Element,
  };

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

    // Hide mu-form's default submit button after render
    this.hideDefaultSubmitButton();
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Hide mu-form's default submit button after each update
    this.hideDefaultSubmitButton();
  }

  private _submitButtonObserver?: MutationObserver;

  private hideDefaultSubmitButton() {
    // Use multiple strategies to hide the default submit button
    requestAnimationFrame(() => {
      // Strategy 1: Query from shadowRoot
      const muForm = this.shadowRoot?.querySelector("mu-form");
      if (muForm) {
        this.hideSubmitButtonsInElement(muForm);
      }

      // Strategy 2: Query from light DOM
      const muFormLight = this.querySelector("mu-form");
      if (muFormLight) {
        this.hideSubmitButtonsInElement(muFormLight);
      }

      // Strategy 3: Setup MutationObserver to catch buttons added dynamically
      if (!this._submitButtonObserver) {
        this.setupSubmitButtonObserver();
      }
    });
  }

  private setupSubmitButtonObserver() {
    const targetNode = this.shadowRoot || this;
    this._submitButtonObserver = new MutationObserver(() => {
      const muForm =
        this.shadowRoot?.querySelector("mu-form") ||
        this.querySelector("mu-form");
      if (muForm) {
        this.hideSubmitButtonsInElement(muForm);
      }
    });

    this._submitButtonObserver.observe(targetNode, {
      childList: true,
      subtree: true,
    });
  }

  private hideSubmitButtonsInElement(element: Element) {
    // Hide our custom "Add to Garage" button
    const customButtons = element.querySelectorAll("button.btn-submit");
    customButtons.forEach((button) => {
      const btn = button as HTMLElement;
      btn.style.display = "none";
      btn.style.visibility = "hidden";
      btn.style.height = "0";
      btn.style.width = "0";
      btn.style.padding = "0";
      btn.style.margin = "0";
      btn.style.opacity = "0";
      btn.style.position = "absolute";
      btn.setAttribute("aria-hidden", "true");
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._submitButtonObserver) {
      this._submitButtonObserver.disconnect();
    }
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

  handleSubmit(event: Form.SubmitEvent<GarageCar>) {
    this.errorMessage = null;

    if (!this._user.authenticated) {
      this.errorMessage = "Authentication required. Please log in.";
      return;
    }

    const formData = event.detail;

    // Debug: Log form data to see what we're getting
    console.log("Form data received:", formData);

    // Extract and validate required fields
    const modelSlug = formData.modelSlug || "";
    const nickname = formData.nickname || "";
    const yearValue = formData.year;
    const trimValue = formData.trim || "";
    const mileageValue = formData.mileage;
    const notes = formData.notes || "";

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
      notes,
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

          <mu-form
            .init=${this.carData
              ? {
                  modelSlug: this.carData.modelSlug,
                  modelName: this.carData.modelName,
                  nickname: this.carData.nickname,
                  year: this.carData.year,
                  trim: this.carData.trim,
                  mileage: this.carData.mileage,
                  notes: this.carData.notes,
                }
              : undefined}
            @mu-form:submit=${this.handleSubmit}
          >
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

            <label>
              <span>Notes</span>
              <textarea
                name="notes"
                rows="6"
                .value=${this.carData?.notes || ""}
                placeholder="Mods installed, maintenance history, future plans..."
              ></textarea>
            </label>

            <button type="button" class="btn-cancel" @click=${this.handleClose}>
              Cancel
            </button>
          </mu-form>
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
      background: var(--color-background-card, #ffffff);
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .modal-content {
        background: #1e1e1e;
      }
    }

    h2 {
      text-align: center;
      margin-bottom: 1.5rem;
      color: var(--color-text);
    }

    mu-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Hide our custom submit button - use mu-form's default instead */
    mu-form button.btn-submit {
      display: none !important;
    }

    /* Style mu-form's default submit button */
    mu-form button[type="submit"]:not(.btn-cancel) {
      padding: 0.8rem 1.5rem;
      background: #c41e3a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 1rem;
      font-family: inherit;
    }

    mu-form button[type="submit"]:not(.btn-cancel):hover:not(:disabled) {
      background: #a01828;
    }

    mu-form button[type="submit"]:not(.btn-cancel):disabled {
      background: #cccccc;
      cursor: not-allowed;
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
      padding: 0.8rem 1rem;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 6px;
      font-size: 1rem;
      background: var(--color-background-input, #f9f9f9);
      color: var(--color-text, #333);
      font-family: inherit;
    }

    @media (prefers-color-scheme: dark) {
      input,
      textarea,
      select {
        background: #2a2a2a;
        color: #fff;
        border-color: #444;
      }
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--color-accent);
      outline: none;
    }

    button[type="submit"] {
      padding: 0.8rem 1.5rem;
      background: #c41e3a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 1rem;
      font-family: inherit;
    }

    button[type="submit"]:hover:not(:disabled) {
      background: #a01828;
    }

    button[type="submit"]:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: var(--color-background-button-secondary);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      padding: 0.8rem 1.5rem;
      border-radius: 6px;
      font-size: 1.05rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-cancel:hover {
      background: var(--color-background-button-secondary-hover);
    }

    .error-message {
      color: #d32f2f;
      padding: 0.75rem 1rem;
      background: #ffebee;
      border: 1px solid #ef9a9a;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }
  `;
}
