import { LitElement, html, css } from "lit";
import { state } from "lit/decorators.js";
import { Auth, History, Observer } from "@calpoly/mustang";

export class RidefolioHeaderElement extends LitElement {
  @state()
  _user: Auth.User = new Auth.User();

  @state()
  private _darkMode: boolean = false;

  _authObserver = new Observer<Auth.Model>(this, "throttle:auth");

  private _darkModeObserver?: MutationObserver;

  private handleDarkModeToggle(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const isDarkMode = checkbox.checked;
    this._darkMode = isDarkMode;

    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._authObserver.observe(({ user }) => {
      if (user) {
        this._user = user;
      }
    });

    // Initialize dark mode from localStorage
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    this._darkMode = savedDarkMode;
    if (savedDarkMode) {
      document.body.classList.add("dark-mode");
    }

    // Watch for body class changes (in case dark mode is toggled elsewhere)
    this._darkModeObserver = new MutationObserver(() => {
      this._darkMode = document.body.classList.contains("dark-mode");
    });
    this._darkModeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._darkModeObserver) {
      this._darkModeObserver.disconnect();
    }
  }

  render() {
    const isAuthenticated = this._user.authenticated;

    return html`
      <header>
        <div class="header-content">
          <div class="header-left">
            <h1>Ridefolio</h1>
          </div>
          <div class="header-right">
            <a href="/app" class="nav-box">Models</a>
            ${isAuthenticated
              ? html`<a href="/app/garage" class="nav-box">My Garage</a>`
              : html`<a href="/app/login" class="nav-box">My Garage</a>`}
            ${isAuthenticated
              ? html`
                  <button
                    class="nav-box btn-secondary"
                    @click=${() => Auth.dispatch(this, "auth/signout")}
                  >
                    Sign Out
                  </button>
                `
              : html`
                  <button
                    class="nav-box btn-primary"
                    @click=${() =>
                      History.dispatch(this, "history/navigate", {
                        href: "/app/login",
                      })}
                  >
                    Sign In
                  </button>
                `}
            <label class="nav-box dark-mode-toggle">
              <input
                type="checkbox"
                autocomplete="off"
                .checked=${this._darkMode}
                @change=${this.handleDarkModeToggle}
              />
              <span>Dark</span>
            </label>
          </div>
        </div>
      </header>
    `;
  }

  static styles = css`
    header {
      background: var(--color-bg-header);
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
      color: var(--color-text-inverted);
      letter-spacing: -0.02em;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .nav-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 100px;
      height: 2.5rem;
      padding: 0 1rem;
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: var(--color-text-inverted);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all var(--transition-base);
      white-space: nowrap;
      cursor: pointer;
      font-family: inherit;
    }

    .nav-box:hover {
      background: rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
    }

    .nav-box.btn-primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      box-shadow: var(--shadow-accent);
    }

    .nav-box.btn-primary:hover {
      background: var(--color-accent-hover);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.35);
    }

    .nav-box.btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .nav-box.btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .nav-box:active {
      transform: translateY(0);
    }

    .dark-mode-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      user-select: none;
    }

    .dark-mode-toggle input[type="checkbox"] {
      cursor: pointer;
      width: 1em;
      height: 1em;
      accent-color: var(--color-accent);
      margin: 0;
    }

    .dark-mode-toggle span {
      font-size: 0.9rem;
      font-weight: var(--font-weight-semibold);
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
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .nav-box {
        flex: 1 1 auto;
        min-width: 0;
      }
    }
  `;
}
