import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { ServiceLog } from "@csc437/server/models";

export class ServiceLogFormElement extends LitElement {
  @property({ type: Number })
  currentMileage?: number;

  @state()
  private date: string = new Date().toISOString().split("T")[0];

  @state()
  private mileage: string = "";

  @state()
  private service: string = "";

  @state()
  private cost: string = "";

  @state()
  private notes: string = "";

  @state()
  private error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.currentMileage) {
      this.mileage = this.currentMileage.toString();
    }
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;

    if (!this.service.trim()) {
      this.error = "Service description is required";
      return;
    }

    const serviceLog: ServiceLog = {
      date: new Date(this.date),
      service: this.service.trim(),
      mileage: this.mileage ? parseInt(this.mileage, 10) : undefined,
      cost: this.cost ? parseFloat(this.cost) : undefined,
      notes: this.notes.trim() || undefined,
    };

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: serviceLog,
        bubbles: true,
        composed: true,
      })
    );
  }

  handleClose() {
    this.dispatchEvent(
      new CustomEvent("close", {
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="modal-overlay" @click=${this.handleClose}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <h2>Add Service Log</h2>
          ${this.error
            ? html`<div class="error-message">${this.error}</div>`
            : ""}
          <form @submit=${this.handleSubmit}>
            <label>
              <span>Date *</span>
              <input
                type="date"
                .value=${this.date}
                @input=${(e: Event) => {
                  this.date = (e.target as HTMLInputElement).value;
                }}
                required
              />
            </label>

            <label>
              <span>Service *</span>
              <input
                type="text"
                .value=${this.service}
                @input=${(e: Event) => {
                  this.service = (e.target as HTMLInputElement).value;
                }}
                placeholder="e.g., Oil Change, Tire Rotation"
                required
              />
            </label>

            <label>
              <span>Mileage (optional)</span>
              <input
                type="number"
                .value=${this.mileage}
                @input=${(e: Event) => {
                  this.mileage = (e.target as HTMLInputElement).value;
                }}
                placeholder="e.g., 45000"
                min="0"
              />
            </label>

            <label>
              <span>Cost (optional)</span>
              <input
                type="number"
                .value=${this.cost}
                @input=${(e: Event) => {
                  this.cost = (e.target as HTMLInputElement).value;
                }}
                placeholder="e.g., 75.50"
                min="0"
                step="0.01"
              />
            </label>

            <label>
              <span>Notes (optional)</span>
              <textarea
                .value=${this.notes}
                @input=${(e: Event) => {
                  this.notes = (e.target as HTMLTextAreaElement).value;
                }}
                placeholder="Additional details about the service..."
                rows="4"
              ></textarea>
            </label>

            <div class="form-actions">
              <button
                type="button"
                class="btn-cancel"
                @click=${this.handleClose}
              >
                Cancel
              </button>
              <button type="submit" class="btn-submit">Add Service Log</button>
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
      font-size: var(--fs-600);
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
    textarea {
      padding: 0.875rem 1.25rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      background: var(--color-bg);
      color: var(--color-text);
      font-family: inherit;
      transition: all var(--transition-base);
    }

    input:focus,
    textarea:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
    }

    .form-actions {
      display: flex;
      gap: var(--space-md);
      margin-top: var(--space-md);
    }

    .btn-cancel {
      flex: 1;
      background: var(--color-bg-hover);
      color: var(--color-text);
      border: 2px solid var(--color-border);
      padding: 0.875rem 2rem;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
    }

    .btn-cancel:hover {
      background: var(--color-border-muted);
      border-color: var(--color-text-muted);
      transform: translateY(-1px);
    }

    .btn-submit {
      flex: 1;
      padding: 0.875rem 2rem;
      background: var(--color-accent);
      color: var(--color-text-inverted);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-accent);
    }

    .btn-submit:hover {
      background: var(--color-accent-dark, #a01828);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.4);
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
