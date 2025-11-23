import { LitElement, html, css } from "lit";
import { state } from "lit/decorators.js";
import { Auth, History, Observer } from "@calpoly/mustang";

export class ThrottleHeaderElement extends LitElement {
  @state()
  _user: Auth.User = new Auth.User();

  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  connectedCallback() {
    super.connectedCallback();
    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });
  }

  render() {
    const isAuthenticated = this._user.authenticated;
    const username = this._user.username;

    return html`
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>Throttle Vault</h1>
            <p>Your ultimate destination for high-performance vehicles</p>
          </div>
          <div class="header-right">
            <nav class="main-nav">
              <a href="/app">Models</a>
              ${isAuthenticated
                ? html`<a href="/app/garage">My Garage</a>`
                : html`<a href="/app/login">My Garage</a>`}
            </nav>
            <div class="auth-status">
              ${isAuthenticated
                ? html`
                    <span id="username-display">Welcome, ${username}</span>
                    <button
                      class="sign-out-btn"
                      @click=${() => Auth.dispatch(this, "auth/signout")}
                    >
                      Sign Out
                    </button>
                  `
                : html`
                    <span id="auth-message">Login to access your garage</span>
                    <button
                      class="sign-in-btn"
                      @click=${() =>
                        History.dispatch(this, "history/navigate", {
                          href: "/app/login",
                        })}
                    >
                      Sign In
                    </button>
                  `}
            </div>
          </div>
        </div>
      </header>
    `;
  }

  static styles = css`
    header {
      background: var(--color-bg-header, #2c3e50);
      color: white;
      padding: 1.5rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-left h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 800;
    }

    .header-left p {
      margin: 0.25rem 0 0 0;
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .main-nav {
      display: flex;
      gap: 1rem;
    }

    .main-nav a {
      color: white;
      text-decoration: none;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .main-nav a:hover {
      background: rgba(255, 255, 255, 0.1);
    }

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

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  `;
}
