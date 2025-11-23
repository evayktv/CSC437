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

  @state()
  selectedImageIndex: number = 0;

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
      document.title = `${this.carModel.name} • Ridefolio`;
      return;
    }

    // Otherwise, load from API if slug changes
    if (changedProperties.has("slug") && !this.carModel) {
      this.loadCarData();
    }
  }

  loadCarData() {
    const carSlug =
      this.slug || new URLSearchParams(window.location.search).get("car");

    if (!carSlug) {
      this.error = "No car specified";
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

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
        document.title = `${data.name} • Ridefolio`;
      })
      .catch((err) => {
        this.error = err.message;
        this.loading = false;
      });
  }

  handleAddToGarage() {
    if (!this._user.authenticated) {
      History.dispatch(this, "history/navigate", { href: "/app/login" });
      return;
    }

    const carSlug =
      this.slug || new URLSearchParams(window.location.search).get("car");
    if (carSlug) {
      History.dispatch(this, "history/navigate", {
        href: `/app/garage?add=${carSlug}`,
      });
    }
  }

  getHeroImage(): string | null {
    if (!this.car?.images?.hero) return null;
    return this.car.images.hero;
  }

  getGalleryImages(): string[] {
    return this.car?.images?.gallery || [];
  }

  getAllImages(): string[] {
    const images: string[] = [];
    if (this.car?.images?.hero) {
      images.push(this.car.images.hero);
    }
    if (this.car?.images?.gallery) {
      images.push(...this.car.images.gallery);
    }
    return images;
  }

  getCategoryDisplay(): string {
    // Map database category values to display names
    const categoryMap: { [key: string]: string } = {
      "muscle-car": "American Muscle",
      "sports-car": "Sports Car",
      suv: "SUV",
      coupe: "Coupe",
      electric: "Electric",
    };
    return categoryMap[this.car?.category || ""] || this.car?.category || "";
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-state">
          <p>Loading car details...</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-state">
          <p class="error">Error: ${this.error}</p>
        </div>
      `;
    }

    if (!this.car) {
      return html`
        <div class="error-state">
          <p>No car data available</p>
        </div>
      `;
    }

    const allImages = this.getAllImages();
    const heroImage = this.getHeroImage();

    return html`
      <!-- Hero Section -->
      <div class="hero-section">
        ${heroImage
          ? html`
              <div class="hero-image-container">
                <img
                  src="${heroImage}"
                  alt="${this.car.name}"
                  class="hero-image"
                  @error=${(e: Event) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                  }}
                />
                <div class="hero-overlay"></div>
              </div>
            `
          : html`
              <div class="hero-placeholder">
                <svg class="icon" aria-hidden="true">
                  <use href="/icons/vehicles.svg#${this.car.icon}" />
                </svg>
              </div>
            `}
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">${this.car.name}</h1>
            <div class="hero-meta">
              <span class="meta-badge">${this.getCategoryDisplay()}</span>
            </div>
          </div>
          <button
            class="btn-hero-action"
            @click=${this.handleAddToGarage}
            ?disabled=${!this._user.authenticated}
          >
            ${this._user.authenticated
              ? html`🚗 Add to My Garage`
              : html`🔒 Sign In to Add`}
          </button>
        </div>
      </div>

      <!-- Image Gallery -->
      ${allImages.length > 1
        ? html`
            <section class="gallery-section" aria-label="Image Gallery">
              <div class="gallery-grid">
                ${allImages.map(
                  (img, index) => html`
                    <div
                      class="gallery-thumb ${index === this.selectedImageIndex
                        ? "active"
                        : ""}"
                      @click=${() => (this.selectedImageIndex = index)}
                    >
                      <img
                        src="${img}"
                        alt="${this.car!.name} - Image ${index + 1}"
                        @error=${(e: Event) => {
                          const imgEl = e.target as HTMLImageElement;
                          imgEl.style.display = "none";
                        }}
                      />
                    </div>
                  `
                )}
              </div>
            </section>
          `
        : ""}

      <!-- Overview Section -->
      <section class="overview-section" aria-labelledby="overview-heading">
        <h2 id="overview-heading">Overview</h2>
        <div class="overview-card">
          <div class="overview-details">
            <div class="overview-detail-item">
              <span class="detail-label">Manufacturer</span>
              <span class="detail-value"
                >${this.car.overview.manufacturer}</span
              >
            </div>
            <div class="overview-detail-item">
              <span class="detail-label">Body Style</span>
              <span class="detail-value">${this.car.overview.bodyStyle}</span>
            </div>
            <div class="overview-detail-item">
              <span class="detail-label">Years</span>
              <span class="detail-value">${this.car.years}</span>
            </div>
            <div class="overview-detail-item">
              <span class="detail-label">Generation</span>
              <span class="detail-value">${this.car.overview.history}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Trims Section -->
      <section class="trims-section" aria-labelledby="trims-heading">
        <h2 id="trims-heading">Available Trims</h2>
        <div class="trims-grid">
          ${this.car.trims.map(
            (trim, index) => html`
              <article
                class="trim-card ${index % 2 === 0
                  ? "highlight-left"
                  : "highlight-right"}"
              >
                ${this.car!.images?.trims?.[trim.name]
                  ? html`
                      <div class="trim-image">
                        <img
                          src="${this.car!.images.trims[trim.name]}"
                          alt="${trim.name} trim"
                          @error=${(e: Event) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                          }}
                        />
                      </div>
                    `
                  : ""}
                <div class="trim-header">
                  <h3>${trim.name}</h3>
                  <span class="trim-years">${trim.years}</span>
                </div>
                <div class="trim-specs">
                  <div class="spec-item">
                    <span class="spec-label">Engine</span>
                    <span class="spec-value">${trim.engine}</span>
                  </div>
                  <div class="spec-item highlight">
                    <span class="spec-label">Horsepower</span>
                    <span class="spec-value">${trim.horsepower} hp</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Torque</span>
                    <span class="spec-value">${trim.torque} lb-ft</span>
                  </div>
                  <div class="spec-item highlight">
                    <span class="spec-label">0-60 mph</span>
                    <span class="spec-value">${trim.zeroToSixty}</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Top Speed</span>
                    <span class="spec-value">${trim.topSpeed}</span>
                  </div>
                </div>
              </article>
            `
          )}
        </div>
      </section>

      <!-- History Timeline -->
      ${this.car.history && this.car.history.length > 0
        ? html`
            <section class="history-section" aria-labelledby="history-heading">
              <h2 id="history-heading">History</h2>
              <div class="timeline">
                ${[...this.car.history].reverse().map(
                  (item) => html`
                    <div class="timeline-item">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <p>${item}</p>
                      </div>
                    </div>
                  `
                )}
              </div>
            </section>
          `
        : ""}

      <!-- Modifications Section -->
      ${this.car.modifications && this.car.modifications.length > 0
        ? html`
            <section
              class="modifications-section"
              aria-labelledby="mods-heading"
            >
              <h2 id="mods-heading">Popular Modifications</h2>
              <div class="mods-grid">
                ${this.car.modifications.map(
                  (mod) => html`
                    <article class="mod-card">
                      <div class="mod-header">
                        <h3>${mod.name}</h3>
                        <span class="mod-type">${mod.type}</span>
                      </div>
                      <div class="mod-details">
                        <div class="mod-stat">
                          <span class="mod-label">HP Gain</span>
                          <span class="mod-value gain">${mod.hpGain}</span>
                        </div>
                        <div class="mod-stat">
                          <span class="mod-label">Cost</span>
                          <span class="mod-value">${mod.costRange}</span>
                        </div>
                        <div class="mod-stat">
                          <span class="mod-label">Installation</span>
                          <span class="mod-value">${mod.install}</span>
                        </div>
                      </div>
                    </article>
                  `
                )}
              </div>
            </section>
          `
        : ""}
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    /* Loading & Error States */
    .loading-state,
    .error-state {
      text-align: center;
      padding: var(--space-2xl);
      color: var(--color-text-muted);
    }

    .error {
      color: var(--color-accent);
      font-weight: var(--font-weight-semibold);
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      margin: -2rem -2rem 3rem -2rem;
      min-height: 500px;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      border-radius: 0 0 var(--radius-xl) var(--radius-xl);
      background: var(--color-bg-hover);
    }

    .hero-image-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.8) 0%,
        rgba(0, 0, 0, 0.4) 50%,
        rgba(0, 0, 0, 0.2) 100%
      );
    }

    .hero-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        var(--color-bg-header) 0%,
        var(--color-bg-hover) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 0;
    }

    .hero-placeholder .icon {
      width: 200px;
      height: 200px;
      fill: var(--color-accent);
      opacity: 0.3;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: var(--space-2xl);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: var(--space-xl);
    }

    .hero-title {
      margin: 0 0 var(--space-md) 0;
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: var(--font-weight-extrabold);
      color: var(--color-text-inverted);
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      letter-spacing: -0.02em;
    }

    .hero-meta {
      display: flex;
      gap: var(--space-sm);
      flex-wrap: wrap;
    }

    .meta-badge {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: var(--radius-full);
      color: var(--color-text-inverted);
      font-size: var(--fs-300);
      font-weight: var(--font-weight-semibold);
    }

    .btn-hero-action {
      padding: 1rem 2rem;
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
      white-space: nowrap;
      position: relative;
      overflow: hidden;
    }

    .btn-hero-action::before {
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

    .btn-hero-action:hover:not(:disabled)::before {
      width: 300px;
      height: 300px;
    }

    .btn-hero-action:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.4);
    }

    .btn-hero-action:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Gallery Section */
    .gallery-section {
      margin-bottom: var(--space-2xl);
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-md);
    }

    .gallery-thumb {
      aspect-ratio: 16 / 9;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      border: 3px solid transparent;
      transition: all var(--transition-base);
      background: var(--color-bg-hover);
    }

    .gallery-thumb:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .gallery-thumb.active {
      border-color: var(--color-accent);
      box-shadow: var(--shadow-accent);
    }

    .gallery-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Overview Section */
    .overview-section {
      margin-bottom: var(--space-2xl);
    }

    h2 {
      margin: 0 0 var(--space-xl) 0;
      font-size: var(--fs-800);
      font-weight: var(--font-weight-extrabold);
      color: var(--color-text);
      letter-spacing: -0.02em;
    }

    .overview-card {
      padding: var(--space-lg);
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
    }

    .overview-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }

    .overview-tags {
      display: flex;
      gap: var(--space-sm);
      margin-bottom: var(--space-md);
      flex-wrap: wrap;
    }

    .overview-tag {
      padding: 0.4rem 0.9rem;
      background: var(--color-bg-hover);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-full);
      font-size: var(--fs-300);
      color: var(--color-text);
      font-weight: var(--font-weight-semibold);
    }

    .overview-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
    }

    .overview-detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .detail-label {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-value {
      font-size: var(--fs-400);
      color: var(--color-text);
      font-weight: var(--font-weight-regular);
      line-height: var(--lh-body);
    }

    /* Trims Section */
    .trims-section {
      margin-bottom: var(--space-2xl);
    }

    .trims-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }

    .trim-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      position: relative;
    }

    .trim-card.highlight-left::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      background: var(--color-accent-gradient);
    }

    .trim-card.highlight-right::before {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 4px;
      background: var(--color-accent-gradient);
    }

    .trim-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }

    .trim-image {
      width: 100%;
      height: 200px;
      background: var(--color-bg-hover);
      overflow: hidden;
    }

    .trim-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .trim-header {
      padding: var(--space-lg);
      padding-bottom: var(--space-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--color-border-muted);
    }

    .trim-header h3 {
      margin: 0;
      font-size: var(--fs-600);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }

    .trim-years {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
    }

    .trim-specs {
      padding: var(--space-lg);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-md);
    }

    .spec-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
    }

    .spec-item.highlight {
      background: rgba(196, 30, 58, 0.05);
      padding: var(--space-sm);
      border-radius: var(--radius-md);
      border-left: 3px solid var(--color-accent);
    }

    .spec-label {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .spec-value {
      font-size: var(--fs-500);
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }

    .spec-item.highlight .spec-value {
      color: var(--color-accent);
      font-size: var(--fs-600);
    }

    /* History Timeline */
    .history-section {
      margin-bottom: var(--space-2xl);
    }

    .timeline {
      position: relative;
      padding-left: var(--space-xl);
    }

    .timeline::before {
      content: "";
      position: absolute;
      left: 0.5rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--color-border);
    }

    .timeline-item {
      position: relative;
      margin-bottom: var(--space-xl);
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-marker {
      position: absolute;
      left: -1.75rem;
      top: 0.25rem;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--color-accent);
      border: 3px solid var(--color-bg-page);
      box-shadow: 0 0 0 2px var(--color-accent);
    }

    .timeline-content {
      background: var(--color-bg-card);
      padding: var(--space-lg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-muted);
      box-shadow: var(--shadow-sm);
    }

    .timeline-content p {
      margin: 0;
      color: var(--color-text);
      font-size: var(--fs-400);
      line-height: var(--lh-body);
    }

    /* Modifications Section */
    .modifications-section {
      margin-bottom: var(--space-2xl);
    }

    .mods-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-lg);
    }

    @media (min-width: 768px) {
      .mods-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .mods-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .mod-card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      padding: var(--space-lg);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      position: relative;
      overflow: hidden;
    }

    .mod-card::before {
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

    .mod-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }

    .mod-card:hover::before {
      transform: scaleX(1);
    }

    .mod-header {
      margin-bottom: var(--space-md);
      padding-bottom: var(--space-md);
      border-bottom: 1px solid var(--color-border-muted);
    }

    .mod-header h3 {
      margin: 0 0 var(--space-xs) 0;
      font-size: var(--fs-500);
      font-weight: var(--font-weight-bold);
      color: var(--color-text);
    }

    .mod-type {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--color-bg-hover);
      border-radius: var(--radius-sm);
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
    }

    .mod-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
    }

    .mod-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .mod-label {
      font-size: var(--fs-300);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-semibold);
    }

    .mod-value {
      font-size: var(--fs-400);
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
    }

    .mod-value.gain {
      color: var(--color-accent);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-section {
        margin: -2rem -1rem 2rem -1rem;
        min-height: 300px;
      }

      .hero-content {
        flex-direction: column;
        align-items: flex-start;
        padding: var(--space-xl);
      }

      .hero-title {
        font-size: clamp(1.75rem, 6vw, 2.5rem);
      }

      .trim-specs {
        grid-template-columns: 1fr;
      }
    }
  `;
}
