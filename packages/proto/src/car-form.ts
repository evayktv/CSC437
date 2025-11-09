import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";

export interface CarFormData {
  slug: string;
  name: string;
  category: string;
  years: string;
  manufacturer: string;
  bodyStyle: string;
  history: string;
}

export class CarFormElement extends LitElement {
  @property()
  mode: "create" | "edit" = "create";

  @property()
  carData?: CarFormData;

  @state()
  private errorMessage: string = "";

  @state()
  private isSubmitting: boolean = false;

  render() {
    const title = this.mode === "create" ? "Add New Model" : "Edit Model";
    const submitLabel = this.mode === "create" ? "Add Model" : "Update Model";

    return html`
      <div class="modal-overlay" @click=${this.handleOverlayClick}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <h2>${title}</h2>
            <button class="close-btn" @click=${this.handleClose}>
              &times;
            </button>
          </div>

          ${this.errorMessage
            ? html`<div class="error-message">${this.errorMessage}</div>`
            : ""}

          <form @submit=${this.handleSubmit}>
            <div class="form-grid">
              <label>
                <span>Model Name *</span>
                <input
                  type="text"
                  name="name"
                  required
                  .value=${this.carData?.name || ""}
                  placeholder="e.g., Ford Mustang"
                />
              </label>

              ${this.mode === "create"
                ? html`
                    <label>
                      <span>Slug (URL-friendly name) *</span>
                      <input
                        type="text"
                        name="slug"
                        required
                        pattern="[a-z0-9\\-]+"
                        .value=${this.carData?.slug || ""}
                        placeholder="e.g., mustang (lowercase, no spaces)"
                      />
                      <small
                        style="color: var(--color-text-muted); font-size: 0.85rem;"
                      >
                        Used in the URL. Use lowercase letters, numbers, and
                        hyphens only.
                      </small>
                    </label>
                  `
                : ""}

              <label>
                <span>Category *</span>
                <select name="category" required>
                  <option value="">Select category...</option>
                  <option
                    value="muscle-car"
                    ?selected=${this.carData?.category === "muscle-car"}
                  >
                    Muscle Car
                  </option>
                  <option
                    value="sports-car"
                    ?selected=${this.carData?.category === "sports-car"}
                  >
                    Sports Car
                  </option>
                  <option
                    value="electric"
                    ?selected=${this.carData?.category === "electric"}
                  >
                    Electric
                  </option>
                  <option
                    value="suv"
                    ?selected=${this.carData?.category === "suv"}
                  >
                    SUV
                  </option>
                  <option
                    value="coupe"
                    ?selected=${this.carData?.category === "coupe"}
                  >
                    Coupe
                  </option>
                </select>
              </label>

              <label>
                <span>Years *</span>
                <input
                  type="text"
                  name="years"
                  required
                  .value=${this.carData?.years || ""}
                  placeholder="e.g., 2015-2024"
                />
              </label>

              <label>
                <span>Manufacturer *</span>
                <input
                  type="text"
                  name="manufacturer"
                  required
                  .value=${this.carData?.manufacturer || ""}
                  placeholder="e.g., Ford"
                />
              </label>

              <label>
                <span>Body Style *</span>
                <input
                  type="text"
                  name="bodyStyle"
                  required
                  .value=${this.carData?.bodyStyle || ""}
                  placeholder="e.g., 2-door coupe"
                />
              </label>
            </div>

            <label class="full-width">
              <span>History/Description *</span>
              <textarea
                name="history"
                required
                rows="4"
                .value=${this.carData?.history || ""}
                placeholder="Enter a brief history or description..."
              ></textarea>
            </label>

            <div class="form-actions">
              <button
                type="button"
                class="btn-secondary"
                @click=${this.handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn-primary"
                ?disabled=${this.isSubmitting}
              >
                ${this.isSubmitting ? "Saving..." : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  handleOverlayClick() {
    this.handleClose();
  }

  handleClose() {
    this.dispatchEvent(new CustomEvent("close"));
  }

  async handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    this.errorMessage = "";
    this.isSubmitting = true;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Get slug - either from form (create mode) or from existing data (edit mode)
    let slug: string;
    if (this.mode === "edit") {
      // In edit mode, use the existing slug from carData
      slug = this.carData?.slug || "";
      if (!slug) {
        this.errorMessage = "Invalid car data";
        this.isSubmitting = false;
        return;
      }
    } else {
      // In create mode, get slug from form
      const slugValue = formData.get("slug");
      if (!slugValue || typeof slugValue !== "string") {
        this.errorMessage = "Slug is required";
        this.isSubmitting = false;
        return;
      }
      slug = slugValue.toLowerCase().trim();
    }

    const carModel = {
      slug,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      icon: "icon-coupe",
      href: `./model.html?car=${slug}`,
      years: formData.get("years") as string,
      overview: {
        manufacturer: formData.get("manufacturer") as string,
        bodyStyle: formData.get("bodyStyle") as string,
        history: formData.get("history") as string,
      },
      trims: [],
      modifications: [],
      history: [],
    };

    try {
      const token = localStorage.getItem("auth_token");
      const url =
        this.mode === "create"
          ? "/api/cars"
          : `/api/cars/${this.carData?.slug}`;
      const method = this.mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(carModel),
      });

      if (!response.ok) {
        throw new Error("Failed to save model");
      }

      this.dispatchEvent(
        new CustomEvent("save-success", {
          detail: { mode: this.mode },
        })
      );
      this.handleClose();
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : "An error occurred";
    } finally {
      this.isSubmitting = false;
    }
  }

  static styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ddd;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #666;
      line-height: 1;
      padding: 0;
      width: 2rem;
      height: 2rem;
    }

    .close-btn:hover {
      color: #000;
    }

    form {
      padding: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    label.full-width {
      grid-column: 1 / -1;
    }

    label span {
      font-weight: 600;
      font-size: 0.9rem;
      color: #333;
    }

    input,
    select,
    textarea {
      padding: 0.75rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #c41e3a;
    }

    input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }

    textarea {
      resize: vertical;
    }

    .error-message {
      margin: 1rem 1.5rem;
      padding: 0.75rem;
      background: #ffebee;
      border: 1px solid #ef9a9a;
      border-radius: 4px;
      color: #d32f2f;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #ddd;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-primary {
      background: #c41e3a;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #a01828;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }
  `;
}
