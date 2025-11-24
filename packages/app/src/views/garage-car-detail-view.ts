import { View } from "@calpoly/mustang";
import { html, css } from "lit";
import { property, state } from "lit/decorators.js";
import { GarageCar, ServiceLog, Note } from "@csc437/server/models";
import { Msg } from "../messages";
import { Model } from "../model";
import { History, Auth, Observer } from "@calpoly/mustang";

export class GarageCarDetailViewElement extends View<Model, Msg> {
  @property({ attribute: "car-id" })
  carId?: string;

  @state()
  private garageCar: GarageCar | null = null;

  @state()
  private carModel: any = null;

  @state()
  private loading: boolean = true;

  @state()
  private error: string | null = null;

  @state()
  private showServiceLogForm: boolean = false;

  @state()
  private showEditForm: boolean = false;

  @state()
  private showNoteForm: boolean = false;

  @state()
  private editingNote: Note | null = null;

  _user = new Auth.User();
  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  constructor() {
    super("throttle:model");
  }

  connectedCallback() {
    super.connectedCallback();

    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
        // Load garage car once user is authenticated
        if (this.carId && !this.garageCar && !this.loading) {
          this.loadGarageCar();
        }
      }
    });
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (name === "car-id" && oldValue !== newValue && newValue) {
      this.loadGarageCar();
    }
  }

  async loadGarageCar() {
    if (!this.carId) return;

    // Ensure user is authenticated before making request
    if (!this._user.authenticated) {
      this.loading = false;
      this.error = "Authentication required. Please log in.";
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const headers = Auth.headers(this._user);
      if (!headers || !headers.Authorization) {
        throw new Error("Authentication token missing");
      }

      const response = await fetch(`/api/garage/${this.carId}`, {
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view this vehicle.");
        } else if (response.status === 404) {
          throw new Error("Vehicle not found.");
        }
        throw new Error("Failed to load garage car");
      }

      const car = await response.json();
      this.garageCar = car;

      // Load car model details for image
      const modelResponse = await fetch(`/api/cars/${car.modelSlug}`);
      if (modelResponse.ok) {
        this.carModel = await modelResponse.json();
      }

      this.loading = false;
    } catch (err: any) {
      this.error = err.message;
      this.loading = false;
    }
  }

  handleAddServiceLog() {
    this.showServiceLogForm = true;
  }

  handleCloseServiceLogForm() {
    this.showServiceLogForm = false;
  }

  handleAddNote() {
    this.editingNote = null;
    this.showNoteForm = true;
  }

  handleEditNote(note: Note) {
    this.editingNote = note;
    this.showNoteForm = true;
  }

  handleCloseNoteForm() {
    this.showNoteForm = false;
    this.editingNote = null;
  }

  async handleNoteSubmit(event: CustomEvent) {
    const note: Note = event.detail;

    if (!this.garageCar?._id) return;

    try {
      const headers = {
        ...Auth.headers(this._user),
        "Content-Type": "application/json",
      };

      let response;
      if (this.editingNote && this.editingNote._id) {
        // Update existing note
        response = await fetch(
          `/api/garage/${this.garageCar._id}/notes/${this.editingNote._id}`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify(note),
          }
        );
      } else {
        // Add new note
        response = await fetch(`/api/garage/${this.garageCar._id}/notes`, {
          method: "POST",
          headers,
          body: JSON.stringify(note),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save note");
      }

      // Reload garage car to get updated notes
      await this.loadGarageCar();
      this.showNoteForm = false;
      this.editingNote = null;
    } catch (err: any) {
      console.error("Error saving note:", err);
      alert(err.message || "Failed to save note");
    }
  }

  async handleDeleteNote(noteId: string) {
    if (!this.garageCar?._id || !noteId) return;

    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/garage/${this.garageCar._id}/notes/${noteId}`,
        {
          method: "DELETE",
          headers: Auth.headers(this._user),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete note");
      }

      // Reload garage car to get updated notes
      await this.loadGarageCar();
    } catch (err: any) {
      console.error("Error deleting note:", err);
      alert(err.message || "Failed to delete note");
    }
  }

  async handleServiceLogSubmit(event: CustomEvent) {
    const serviceLog: ServiceLog = event.detail;

    if (!this.garageCar?._id) return;

    try {
      const response = await fetch(
        `/api/garage/${this.garageCar._id}/service-logs`,
        {
          method: "POST",
          headers: {
            ...Auth.headers(this._user),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(serviceLog),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to add service log");
      }

      // Reload garage car to get updated service logs
      await this.loadGarageCar();
      this.showServiceLogForm = false;
    } catch (err: any) {
      console.error("Error adding service log:", err);
      alert(err.message || "Failed to add service log");
    }
  }

  formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (this.error || !this.garageCar) {
      return html`<div class="error">${this.error || "Car not found"}</div>`;
    }

    const car = this.garageCar;
    const image =
      this.carModel?.images?.trims?.[car.trim] ||
      this.carModel?.images?.hero ||
      null;
    const serviceLogs = car.serviceLogs || [];

    // Handle legacy notes format (string) vs new format (array)
    let notes: Note[] = [];
    if (Array.isArray(car.notes)) {
      notes = car.notes;
    } else if (car.notes && typeof car.notes === "string" && car.notes.trim()) {
      // Legacy format: convert old string notes to array (optional migration)
      // For now, just use empty array
      notes = [];
    }

    return html`
      <main class="container">
        <button
          class="btn-back"
          @click=${() =>
            History.dispatch(this, "history/navigate", { href: "/app/garage" })}
        >
          ← Back to Garage
        </button>

        <!-- Hero Section -->
        <div class="hero-section">
          ${image
            ? html`
                <div class="hero-image">
                  <img src="${image}" alt="${car.modelName}" />
                </div>
              `
            : ""}
          <div class="hero-content">
            <div class="hero-header">
              <div>
                <h1>${car.nickname}</h1>
                <p class="model-name">${car.modelName}</p>
                <div class="hero-tags">
                  <span class="tag">${car.year}</span>
                  <span class="tag">${car.trim}</span>
                </div>
              </div>
              <button
                class="btn-edit"
                @click=${this.handleEdit}
                title="Edit vehicle"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Vehicle Information -->
        <section class="info-section">
          <h2>Vehicle Information</h2>
          <div class="info-grid">
            <div class="info-card">
              <h3>Model</h3>
              <p>${car.modelName}</p>
            </div>
            <div class="info-card">
              <h3>Year</h3>
              <p>${car.year}</p>
            </div>
            <div class="info-card">
              <h3>Trim</h3>
              <p>${car.trim}</p>
            </div>
            ${car.mileage
              ? html`
                  <div class="info-card">
                    <h3>Mileage</h3>
                    <p>${car.mileage.toLocaleString()} mi</p>
                  </div>
                `
              : ""}
          </div>
        </section>

        <!-- Notes Section -->
        <section class="notes-section">
          <div class="section-header">
            <h2>Notes</h2>
            <button class="btn-add-note" @click=${this.handleAddNote}>
              + Add Note
            </button>
          </div>

          ${notes.length === 0
            ? html`
                <div class="empty-state">
                  <p>
                    No notes yet. Add your first note to start tracking
                    information about this vehicle!
                  </p>
                </div>
              `
            : html`
                <div class="timeline">
                  ${[...notes]
                    .sort((a, b) => {
                      // Sort by date (newest first)
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      const dateDiff = dateB - dateA;

                      // If dates are different, sort by date
                      if (dateDiff !== 0) {
                        return dateDiff;
                      }

                      // If dates are the same, sort by _id (ObjectId contains timestamp)
                      if (a._id && b._id) {
                        return b._id > a._id ? 1 : -1;
                      }

                      return 0;
                    })
                    .map(
                      (note) => html`
                        <div class="timeline-item">
                          <div class="timeline-marker"></div>
                          <div class="timeline-content">
                            <div class="note-header">
                              <span class="note-date"
                                >${note.date
                                  ? this.formatDate(note.date)
                                  : "Invalid date"}</span
                              >
                              <div class="note-actions">
                                <button
                                  class="btn-icon btn-edit-note"
                                  @click=${() => this.handleEditNote(note)}
                                  title="Edit note"
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <path
                                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                    ></path>
                                    <path
                                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                                    ></path>
                                  </svg>
                                </button>
                                <button
                                  class="btn-icon btn-delete-note"
                                  @click=${() =>
                                    note._id && this.handleDeleteNote(note._id)}
                                  title="Delete note"
                                >
                                  <svg
                                    width="16"
                                    height="16"
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
                                    <line
                                      x1="10"
                                      y1="11"
                                      x2="10"
                                      y2="17"
                                    ></line>
                                    <line
                                      x1="14"
                                      y1="11"
                                      x2="14"
                                      y2="17"
                                    ></line>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <p class="note-content">${note.content}</p>
                          </div>
                        </div>
                      `
                    )}
                </div>
              `}
        </section>

        <!-- Service Logs Section -->
        <section class="service-logs-section">
          <div class="section-header">
            <h2>Service Logs</h2>
            <button class="btn-add-log" @click=${this.handleAddServiceLog}>
              + Add Service Log
            </button>
          </div>

          ${serviceLogs.length === 0
            ? html`
                <div class="empty-state">
                  <p>
                    No service logs yet. Add your first service log to start
                    tracking maintenance!
                  </p>
                </div>
              `
            : html`
                <div class="timeline">
                  ${[...serviceLogs]
                    .sort((a, b) => {
                      // Sort by date (newest first)
                      const dateA = new Date(a.date).getTime();
                      const dateB = new Date(b.date).getTime();
                      const dateDiff = dateB - dateA;

                      // If dates are different, sort by date
                      if (dateDiff !== 0) {
                        return dateDiff;
                      }

                      // If dates are the same, sort by _id (ObjectId contains timestamp)
                      // More recent ObjectIds are "greater" when compared as strings
                      if (a._id && b._id) {
                        return b._id > a._id ? 1 : -1;
                      }

                      return 0;
                    })
                    .map(
                      (log) => html`
                        <div class="timeline-item">
                          <div class="timeline-marker"></div>
                          <div class="timeline-content">
                            <div class="log-header">
                              <h3>${log.service}</h3>
                              <span class="log-date"
                                >${this.formatDate(log.date)}</span
                              >
                            </div>
                            <div class="log-details">
                              ${log.mileage
                                ? html`
                                    <span class="log-detail"
                                      >Mileage: ${log.mileage.toLocaleString()}
                                      mi</span
                                    >
                                  `
                                : ""}
                              ${log.cost
                                ? html`
                                    <span class="log-detail"
                                      >Cost: $${log.cost.toLocaleString()}</span
                                    >
                                  `
                                : ""}
                            </div>
                            ${log.notes
                              ? html`<p class="log-notes">${log.notes}</p>`
                              : ""}
                          </div>
                        </div>
                      `
                    )}
                </div>
              `}
        </section>

        ${this.showNoteForm
          ? html`
              <note-form
                .note=${this.editingNote}
                @close=${this.handleCloseNoteForm}
                @submit=${this.handleNoteSubmit}
              ></note-form>
            `
          : ""}
        ${this.showServiceLogForm
          ? html`
              <service-log-form
                .currentMileage=${car.mileage}
                @close=${this.handleCloseServiceLogForm}
                @submit=${this.handleServiceLogSubmit}
              ></service-log-form>
            `
          : ""}
        ${this.showEditForm && this.garageCar
          ? html`
              <garage-car-form
                mode="edit"
                .carData=${{
                  id: this.garageCar._id || "",
                  modelSlug: this.garageCar.modelSlug,
                  modelName: this.garageCar.modelName,
                  nickname: this.garageCar.nickname,
                  year: this.garageCar.year,
                  trim: this.garageCar.trim,
                  mileage: this.garageCar.mileage,
                }}
                @close=${this.handleCloseEditForm}
                @save-success=${this.handleEditSuccess}
              ></garage-car-form>
            `
          : ""}
      </main>
    `;
  }

  handleEdit() {
    this.showEditForm = true;
  }

  handleCloseEditForm() {
    this.showEditForm = false;
  }

  async handleEditSuccess() {
    this.showEditForm = false;
    // Reload the garage car to show updated data
    await this.loadGarageCar();
  }

  static styles = css`
    :host {
      display: block;
    }

    main.container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading,
    .error {
      text-align: center;
      padding: 2rem;
      font-size: var(--fs-500);
    }

    .error {
      color: var(--color-error, #d32f2f);
    }

    .btn-back {
      margin-bottom: var(--space-xl);
      padding: var(--space-sm) var(--space-md);
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      cursor: pointer;
      font-family: inherit;
      font-size: var(--fs-400);
      transition: all var(--transition-base);
    }

    .btn-back:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-accent);
    }

    .hero-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-xl);
      margin-bottom: var(--space-2xl);
    }

    .hero-image {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background: var(--color-bg-hover);
    }

    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-lg);
      width: 100%;
    }

    .hero-content h1 {
      font-size: var(--fs-800);
      margin: 0 0 var(--space-sm) 0;
      color: var(--color-text);
    }

    .model-name {
      font-size: var(--fs-500);
      color: var(--color-text-muted);
      margin: 0 0 var(--space-md) 0;
    }

    .btn-edit {
      padding: var(--space-sm) var(--space-lg);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text);
      cursor: pointer;
      font-family: inherit;
      font-size: var(--fs-400);
      font-weight: var(--font-weight-medium);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      white-space: nowrap;
      height: fit-content;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .btn-edit svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .btn-edit span {
      line-height: 1;
    }

    .btn-edit:hover {
      background: var(--color-bg-hover);
      border-color: var(--color-accent);
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .btn-edit:active {
      transform: translateY(0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .hero-tags {
      display: flex;
      gap: var(--space-sm);
      flex-wrap: wrap;
    }

    .tag {
      padding: var(--space-xs) var(--space-md);
      background: var(--color-accent);
      color: var(--color-text-inverted);
      border-radius: var(--radius-full);
      font-size: var(--fs-300);
      font-weight: var(--font-weight-semibold);
    }

    .info-section {
      margin-bottom: var(--space-2xl);
    }

    .info-section h2 {
      font-size: var(--fs-700);
      margin-bottom: var(--space-lg);
      color: var(--color-text);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-lg);
    }

    .info-card {
      padding: var(--space-lg);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
    }

    .info-card h3 {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      margin: 0 0 var(--space-xs) 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-card p {
      font-size: var(--fs-500);
      margin: 0;
      color: var(--color-text);
      font-weight: var(--font-weight-semibold);
    }

    .notes-section {
      margin-bottom: var(--space-2xl);
    }

    .btn-add-note {
      background: var(--color-accent);
      color: var(--color-text-inverted);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(196, 30, 58, 0.2);
    }

    .btn-add-note:hover {
      background: #a01828;
      box-shadow: 0 4px 8px rgba(196, 30, 58, 0.3);
      transform: translateY(-1px);
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-sm);
    }

    .note-date {
      color: var(--color-text-muted);
      font-size: var(--fs-300);
      font-weight: var(--font-weight-medium);
    }

    .note-actions {
      display: flex;
      gap: var(--space-xs);
    }

    .btn-icon {
      background: transparent;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--color-text-muted);
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon:hover {
      background: var(--color-bg-hover);
      color: var(--color-text);
    }

    .btn-edit-note:hover {
      color: var(--color-accent);
    }

    .btn-delete-note:hover {
      color: #d32f2f;
    }

    .note-content {
      margin: 0;
      color: var(--color-text);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .service-logs-section {
      margin-bottom: var(--space-2xl);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-lg);
    }

    .section-header h2 {
      font-size: var(--fs-700);
      margin: 0;
      color: var(--color-text);
    }

    .btn-add-log {
      padding: var(--space-sm) var(--space-lg);
      background: var(--color-accent);
      color: var(--color-text-inverted);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
    }

    .btn-add-log:hover {
      background: var(--color-accent-dark, #a01828);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--color-text-muted);
      background: var(--color-bg-card);
      border: 2px dashed var(--color-border-muted);
      border-radius: var(--radius-lg);
    }

    .timeline {
      position: relative;
      padding-left: var(--space-xl);
    }

    .timeline::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-border);
    }

    .timeline-item {
      position: relative;
      margin-bottom: var(--space-xl);
    }

    .timeline-marker {
      position: absolute;
      left: calc(-1 * var(--space-xl) - 6px);
      top: 0;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--color-accent);
      border: 3px solid var(--color-bg);
      z-index: 1;
    }

    .timeline-content {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-sm);
    }

    .log-header h3 {
      margin: 0;
      font-size: var(--fs-500);
      color: var(--color-text);
    }

    .log-date {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
    }

    .log-details {
      display: flex;
      gap: var(--space-md);
      margin-bottom: var(--space-sm);
      flex-wrap: wrap;
    }

    .log-detail {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
    }

    .log-notes {
      margin: var(--space-sm) 0 0 0;
      color: var(--color-text);
      line-height: 1.6;
    }
  `;
}
