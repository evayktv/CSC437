import { css, html, LitElement } from "lit";

export class LoginViewElement extends LitElement {
  render() {
    return html`
      <main class="container">
        <div class="login-container">
          <login-form api="/auth" redirect="/app"></login-form>
        </div>
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

    .login-container {
      max-width: 400px;
      margin: 2rem auto;
      padding: 2rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-bg-card);
      box-shadow: var(--shadow-md);
    }
  `;
}
