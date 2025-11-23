import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";

interface Car {
  slug: string;
  name: string;
  icon: string;
  href: string;
  years: string;
  category: string;
}

export class CarCatalogElement extends LitElement {
  @property()
  src?: string;

  @state()
  cars: Array<Car> = [];

  connectedCallback() {
    super.connectedCallback();
    if (this.src) this.hydrate(this.src);
  }

  hydrate(src: string) {
    fetch(src)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      })
      .then((json: Array<object>) => {
        if (json) {
          this.cars = json as Array<Car>;
        }
      })
      .catch((error) => {
        console.error("Error fetching car data:", error);
      });
  }

  render() {
    return html`
      <ul class="grid-cards">
        ${this.cars.map(
          (car) => html`
            <li class="car-card">
              <car-model-card
                icon="${car.icon}"
                href="/app/models/${car.slug}"
                years="${car.years}"
              >
                ${car.name}
              </car-model-card>
            </li>
          `
        )}
      </ul>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    ul.grid-cards {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--grid-gap);
      list-style: none;
      padding: 0;
      margin: 0;
    }

    @media (min-width: 768px) {
      ul.grid-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      ul.grid-cards {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    li.car-card {
      display: block;
    }
  `;
}
