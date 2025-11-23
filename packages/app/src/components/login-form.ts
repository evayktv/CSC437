import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";
import { Auth } from "@calpoly/mustang";

export class LoginFormElement extends LitElement {
  @property()
  api: string = "";

  @property()
  redirect: string = "/";

  @state()
  private mode: "login" | "register" = "login";

  @state()
  private errorMessage: string = "";

  render() {
    const isLogin = this.mode === "login";
    const title = isLogin ? "Sign In" : "Register";
    const submitLabel = isLogin ? "Sign In" : "Create Account";
    const toggleLabel = isLogin
      ? "Need an account? Register"
      : "Have an account? Sign in";

    return html`
      <h2>${title}</h2>
      ${this.errorMessage
        ? html`<div class="error-message">${this.errorMessage}</div>`
        : ""}
      <form @submit=${this.handleSubmit}>
        <label>
          Username
          <input type="text" name="username" required autocomplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            autocomplete="${isLogin ? "current-password" : "new-password"}"
          />
        </label>
        <button type="submit">${submitLabel}</button>
      </form>
      <div class="toggle-mode">
        <a href="#" @click=${this.toggleMode}>${toggleLabel}</a>
      </div>
    `;
  }

  toggleMode(event: Event) {
    event.preventDefault();
    this.mode = this.mode === "login" ? "register" : "login";
    this.errorMessage = "";
  }

  async handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    this.errorMessage = "";

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const endpoint =
      this.mode === "login" ? `${this.api}/login` : `${this.api}/register`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // Try to parse JSON error, fallback to generic messages
        let errorMessage = "Authentication failed";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Not JSON, use status-based messages
          if (response.status === 401) {
            errorMessage =
              this.mode === "login"
                ? "Invalid username or password"
                : "Registration failed";
          } else if (response.status === 409) {
            errorMessage = "Username already exists";
          }
        }

        throw new Error(errorMessage);
      }

      const { token } = await response.json();

      // Dispatch auth/signin message to Auth.Provider
      Auth.dispatch(this, "auth/signin", { token, redirect: this.redirect });
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : "An error occurred";
    }
  }

  static styles = css`
    :host {
      display: block;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-weight: bold;
    }

    input {
      padding: 0.875rem 1.25rem;
      border: 2px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-family: inherit;
      background: var(--color-bg-card);
      color: var(--color-text);
      transition: all var(--transition-base);
    }

    input:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
    }

    button {
      padding: 0.875rem 2rem;
      background: var(--color-accent-gradient);
      color: var(--color-text-inverted);
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--fs-400);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
      font-family: inherit;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-accent);
      position: relative;
      overflow: hidden;
    }

    button::before {
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

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px 0 rgba(196, 30, 58, 0.4);
    }

    button:hover::before {
      width: 300px;
      height: 300px;
    }

    button:active {
      transform: translateY(0);
    }

    .error-message {
      color: #d32f2f;
      padding: 0.875rem 1.25rem;
      background: rgba(255, 235, 238, 0.8);
      border: 2px solid rgba(239, 154, 154, 0.6);
      border-radius: var(--radius-md);
      text-align: center;
      font-weight: var(--font-weight-semibold);
      font-size: var(--fs-300);
      margin-bottom: var(--space-md);
      animation: shake 0.3s ease-in-out;
      box-shadow: var(--shadow-sm);
    }

    :host-context(body.dark-mode) .error-message {
      background: rgba(211, 47, 47, 0.15);
      border-color: rgba(239, 154, 154, 0.4);
      color: #ff6b7a;
    }

    @keyframes shake {
      0%,
      100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-5px);
      }
      75% {
        transform: translateX(5px);
      }
    }

    .toggle-mode {
      text-align: center;
      margin-top: 1rem;
    }

    .toggle-mode a {
      color: var(--color-accent, #007bff);
      text-decoration: none;
    }

    .toggle-mode a:hover {
      text-decoration: underline;
    }
  `;
}
