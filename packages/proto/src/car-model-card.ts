import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

export class CarModelCardElement extends LitElement {
  @property()
  icon?: string;

  @property()
  href?: string;

  @property()
  years?: string;

  override render() {
    console.log("Rendering car-model-card", {
      icon: this.icon,
      href: this.href,
      years: this.years,
    });
    return html`
      <a href="${this.href}" class="card-link">
        <svg class="icon" aria-hidden="true" focusable="false">
          <use href="/icons/vehicles.svg#${this.icon}" />
        </svg>
        <span class="title">
          <slot></slot>
        </span>
        <small>(history: ${this.years} modern gen)</small>
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
      gap: var(--space-sm);
      padding: var(--space-md);
      border: 1px solid var(--color-border-muted);
      border-radius: 8px;
      background: var(--color-bg-section);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: box-shadow 0.2s ease;
      text-decoration: none;
      color: var(--color-text);
      cursor: pointer;
    }

    a.card-link:hover {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    svg.icon {
      display: block;
      height: 1.5em;
      width: 1.5em;
      fill: currentColor;
      color: var(--color-accent);
      margin-bottom: var(--space-xs);
    }

    .title {
      color: var(--color-link);
      font-weight: var(--font-weight-bold);
      font-size: var(--fs-400);
    }

    a.card-link:hover .title {
      color: var(--color-link-hover);
      text-decoration: underline;
    }

    small {
      color: var(--color-text);
      opacity: 0.8;
      font-size: var(--fs-300);
    }
  `;
}
