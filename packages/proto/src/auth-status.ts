import { LitElement, html, css } from "lit";
import { state } from "lit/decorators.js";
import { Auth, Observer } from "@calpoly/mustang";

export class AuthStatusElement extends LitElement {
  @state()
  private user: Auth.User = new Auth.User();

  _authObserver = new Observer<Auth.Model>(this, "my:auth");

  connectedCallback() {
    super.connectedCallback();
    this._authObserver.observe(({ user }) => {
      if (user) {
        this.user = user;
      }
    });
  }

  render() {
    const isAuthenticated = this.user.authenticated;
    const username = this.user.username;

    return html`
      <div class="auth-status">
        ${isAuthenticated
          ? html`
              <span id="username-display">Welcome, ${username}</span>
              <button class="sign-out-btn" @click=${this.handleSignOut}>
                Sign Out
              </button>
            `
          : html`
              <span id="auth-message">Login to access your garage</span>
              <button
                class="sign-in-btn"
                @click=${() => (window.location.href = "/login.html")}
              >
                Sign In
              </button>
            `}
      </div>
    `;
  }

  handleSignOut() {
    Auth.dispatch(this, "auth/signout");
  }

  static styles = css`
    .auth-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }

    #username-display {
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    #auth-message {
      font-weight: 500;
      color: white;
      font-size: 0.9rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .sign-in-btn,
    .sign-out-btn {
      padding: 0.5rem 1rem;
      background: var(--color-accent, #c41e3a);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.9rem;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
    }

    .sign-in-btn:hover,
    .sign-out-btn:hover {
      opacity: 0.85;
    }
  `;
}
