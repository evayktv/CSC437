import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class CarModelCardElement extends LitElement {
  @property()
  icon?: string;

  @property()
  href?: string;

  @property({ type: String })
  image?: string | null;

  override render() {
    return html`
      <a href="${this.href}" class="card-link">
        ${this.image
          ? html`
              <div class="card-image">
                <img
                  src="${this.image}"
                  alt=""
                  @error=${(e: Event) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = "none";
                    // Fallback to icon if image fails
                    const fallback = this.shadowRoot?.querySelector(
                      ".icon-fallback"
                    ) as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
              </div>
            `
          : html`
              <svg
                class="icon icon-fallback"
                aria-hidden="true"
                focusable="false"
              >
                <use href="/icons/vehicles.svg#${this.icon}" />
              </svg>
            `}
        <span class="title">
          <slot></slot>
        </span>
      </a>
    `;
  }

  static styles = css`
    * {
      margin: 0;
      box-sizing: border-box;
    }

    :host {
      display: block;
    }

    a.card-link {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-xl);
      border: 1px solid var(--color-border-muted);
      border-radius: var(--radius-lg);
      background: var(--color-bg-card);
      box-shadow: var(--shadow-sm);
      transition: all var(--transition-base);
      text-decoration: none;
      color: var(--color-text);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      height: 100%;
    }

    a.card-link::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: var(--color-accent-gradient);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--transition-base);
    }

    a.card-link:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
      border-color: var(--color-accent);
    }

    a.card-link:hover::before {
      transform: scaleX(1);
    }

    .card-image {
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: var(--radius-md);
      background: var(--color-bg-hover);
      margin-bottom: var(--space-md);
      position: relative;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--transition-base);
    }

    a.card-link:hover .card-image img {
      transform: scale(1.05);
    }

    svg.icon,
    svg.icon-fallback {
      display: none;
      height: 3em;
      width: 3em;
      fill: currentColor;
      color: var(--color-accent);
      margin-bottom: var(--space-sm);
      transition: transform var(--transition-base);
    }

    svg.icon-fallback {
      display: block;
    }

    a.card-link:hover svg.icon,
    a.card-link:hover svg.icon-fallback {
      transform: scale(1.1) rotate(5deg);
    }

    .title {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
      font-size: var(--fs-600);
      line-height: 1.3;
      transition: color var(--transition-base);
    }

    a.card-link:hover .title {
      color: var(--color-accent);
    }
  `;
}
