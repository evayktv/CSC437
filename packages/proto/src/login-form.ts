import { css, html, LitElement } from "lit";
import { property, state } from "lit/decorators.js";

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

      // Store token in localStorage
      localStorage.setItem("auth_token", token);
      localStorage.setItem("username", username);

      // Dispatch event for other components
      this.dispatchEvent(
        new CustomEvent("auth:login", {
          bubbles: true,
          composed: true,
          detail: { username, token },
        })
      );

      // Redirect
      window.location.href = this.redirect;
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
      padding: 0.75rem;
      border: 1px solid var(--color-border, #ccc);
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
    }

    button {
      padding: 0.75rem;
      background: var(--color-accent, #007bff);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      font-family: inherit;
    }

    button:hover {
      opacity: 0.9;
    }

    .error-message {
      color: #d32f2f;
      padding: 0.75rem 1rem;
      background: #ffebee;
      border: 1px solid #ef9a9a;
      border-radius: 4px;
      text-align: center;
      font-weight: 500;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
      animation: shake 0.3s ease-in-out;
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
