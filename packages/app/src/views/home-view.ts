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
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 1.5rem;
      font-size: 2rem;
      color: var(--color-text);
    }
  `;
}
