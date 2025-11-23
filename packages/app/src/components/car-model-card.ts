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

    svg.icon {
      display: block;
      height: 3em;
      width: 3em;
      fill: currentColor;
      color: var(--color-accent);
      margin-bottom: var(--space-sm);
      transition: transform var(--transition-base);
    }

    a.card-link:hover svg.icon {
      transform: scale(1.1) rotate(5deg);
    }

    .title {
      color: var(--color-text);
      font-weight: var(--font-weight-bold);
      font-size: var(--fs-500);
      line-height: 1.3;
      transition: color var(--transition-base);
    }

    a.card-link:hover .title {
      color: var(--color-accent);
    }

    small {
      color: var(--color-text-muted);
      font-size: var(--fs-300);
      font-weight: 500;
    }
  `;
}
