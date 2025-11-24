import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { Note } from "@csc437/server/models";

export class NoteFormElement extends LitElement {
  @property({ type: Object })
  note?: Note;

  @state()
  private date: string = new Date().toISOString().split("T")[0];

  @state()
  private content: string = "";

  @state()
  private error: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.note) {
      // Editing existing note
      this.date = new Date(this.note.date).toISOString().split("T")[0];
      this.content = this.note.content;
    }
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    this.error = null;

    if (!this.content.trim()) {
      this.error = "Note content is required";
      return;
    }

    const note: Note = {
      _id: this.note?._id,
      date: new Date(this.date),
      content: this.content.trim(),
    };

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: note,
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
          <h2>${this.note ? "Edit Note" : "Add Note"}</h2>
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
              <span>Note *</span>
              <textarea
                .value=${this.content}
                @input=${(e: Event) => {
                  this.content = (e.target as HTMLTextAreaElement).value;
                }}
                placeholder="Enter your note here..."
                rows="6"
                required
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
              <button type="submit" class="btn-submit">
                ${this.note ? "Save Changes" : "Add Note"}
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
      font-size: var(--fs-300);
    }

    input,
    textarea {
      padding: 0.75rem 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-text);
      font-family: inherit;
      font-size: var(--fs-400);
      transition: all 0.2s ease;
    }

    textarea {
      resize: vertical;
      min-height: 120px;
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
