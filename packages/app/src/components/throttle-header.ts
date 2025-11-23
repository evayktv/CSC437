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
      background: linear-gradient(
        135deg,
        var(--color-bg-header) 0%,
        #252937 100%
      );
      color: var(--color-text-inverted);
      padding: 1.75rem 2rem;
      box-shadow: var(--shadow-lg);
      border-bottom: 3px solid var(--color-accent);
      position: relative;
      overflow: hidden;
    }

    header::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--color-accent-gradient);
      opacity: 0.8;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .header-left h1 {
      margin: 0;
      font-size: clamp(1.75rem, 4vw, 2.25rem);
      font-weight: 800;
      background: linear-gradient(135deg, #ffffff 0%, #e4e6eb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .header-left p {
      margin: 0.5rem 0 0 0;
      font-size: 0.95rem;
      opacity: 0.85;
      font-weight: 400;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .main-nav {
      display: flex;
      gap: 0.5rem;
    }

    .main-nav a {
      color: var(--color-text-inverted);
      text-decoration: none;
      font-weight: 600;
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-base);
      font-size: 0.95rem;
      position: relative;
    }

    .main-nav a::after {
      content: "";
      position: absolute;
      bottom: 0.25rem;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 60%;
      height: 2px;
      background: var(--color-accent);
      transition: transform var(--transition-base);
    }

    .main-nav a:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    .main-nav a:hover::after {
      transform: translateX(-50%) scaleX(1);
    }

    .auth-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-lg);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    #username-display {
      font-weight: 600;
      color: var(--color-text-inverted);
      font-size: 0.95rem;
    }

    #auth-message {
      font-weight: 500;
      color: var(--color-text-inverted);
      font-size: 0.9rem;
      opacity: 0.9;
    }

    .sign-in-btn,
    .sign-out-btn {
      padding: 0.625rem 1.5rem;
      background: var(--color-accent-gradient);
      color: var(--color-text-inverted);
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      cursor: pointer;
      font-weight: 600;
      font-family: inherit;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-accent);
      position: relative;
      overflow: hidden;
    }

    .sign-in-btn::before,
    .sign-out-btn::before {
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

    .sign-in-btn:hover::before,
    .sign-out-btn:hover::before {
      width: 300px;
      height: 300px;
    }

    .sign-in-btn:hover,
    .sign-out-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.35);
    }

    .sign-in-btn:active,
    .sign-out-btn:active {
      transform: translateY(0);
    }

    @media (max-width: 768px) {
      header {
        padding: 1.25rem 1.5rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.25rem;
      }

      .header-right {
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .main-nav {
        order: 2;
        width: 100%;
        justify-content: flex-start;
      }

      .auth-status {
        order: 1;
      }
    }
  `;
}
