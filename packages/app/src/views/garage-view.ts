import { css, html, LitElement } from "lit";

export class GarageViewElement extends LitElement {
  render() {
    return html`
      <main class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/app">Models</a> ▸
          <strong>My Garage</strong>
        </nav>

        <section aria-labelledby="garage">
          <h2 id="garage">Your Vehicles</h2>
          <garage-catalog src="/api/garage"></garage-catalog>
        </section>
      </main>
    `;
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

    nav.breadcrumb {
      margin-bottom: 1rem;
    }

    nav.breadcrumb a {
      color: var(--color-accent, #c41e3a);
      text-decoration: none;
    }

    nav.breadcrumb a:hover {
      text-decoration: underline;
    }

    h2 {
      margin-bottom: 1.5rem;
      font-size: 2rem;
      color: var(--color-text);
    }
  `;
}
