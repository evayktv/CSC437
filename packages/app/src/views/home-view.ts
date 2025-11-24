import { css, html, LitElement } from "lit";

export class HomeViewElement extends LitElement {
  render() {
    return html`
      <section aria-labelledby="models">
        <h2 id="models">Models</h2>
        <car-catalog src="/api/cars"></car-catalog>
      </section>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    section {
      padding: var(--space-2xl) var(--space-xl);
      max-width: var(--container-max);
      margin: 0 auto;
    }

    h2 {
      margin-bottom: var(--space-xl);
      font-size: var(--fs-800);
      color: var(--color-text);
      font-weight: var(--font-weight-extrabold);
      letter-spacing: -0.02em;
    }
  `;
}
