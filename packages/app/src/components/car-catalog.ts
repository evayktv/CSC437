import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";

interface Car {
  slug: string;
  name: string;
  icon: string;
  href: string;
  years: string;
  category: string;
  image?: string | null;
}

export class CarCatalogElement extends LitElement {
  @property()
  src?: string;

  @state()
  cars: Array<Car> = [];

  @state()
  selectedCategory: string = "all";

  @state()
  sortBy: "alphabetical" | "default" = "default";

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

  getCategoryDisplay(category: string): string {
    const categoryMap: { [key: string]: string } = {
      "muscle-car": "American Muscle",
      "sports-car": "Sports Car",
      "german-sports": "German Sports",
      "japanese-sports": "Japanese Sports",
      "american-sports": "American Sports",
      "korean-sports": "Korean Sports",
      "luxury-sports": "Luxury Sports",
      "luxury-sedan": "Luxury Sedan",
      supercar: "Supercar",
    };
    return categoryMap[category] || category;
  }

  getUniqueCategories(): Array<{ value: string; display: string }> {
    const categories = [...new Set(this.cars.map((car) => car.category))];
    return categories
      .map((cat) => ({
        value: cat,
        display: this.getCategoryDisplay(cat),
      }))
      .sort((a, b) => a.display.localeCompare(b.display));
  }

  getFilteredAndSortedCars(): Array<Car> {
    let filtered = this.cars;

    // Filter by category
    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(
        (car) => car.category === this.selectedCategory
      );
    }

    // Sort
    if (this.sortBy === "alphabetical") {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }

  handleCategoryChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.selectedCategory = select.value;
  };

  handleSortChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    this.sortBy = select.value as "alphabetical" | "default";
  };

  render() {
    const filteredCars = this.getFilteredAndSortedCars();
    const categories = this.getUniqueCategories();

    return html`
      <div class="filters-container">
        <div class="filter-group">
          <label for="category-filter">Filter by Type:</label>
          <select
            id="category-filter"
            class="filter-select"
            @change=${this.handleCategoryChange}
            .value=${this.selectedCategory}
          >
            <option value="all">All Types</option>
            ${categories.map(
              (cat) => html`
                <option value="${cat.value}">${cat.display}</option>
              `
            )}
          </select>
        </div>

        <div class="filter-group">
          <label for="sort-filter">Sort by:</label>
          <select
            id="sort-filter"
            class="filter-select"
            @change=${this.handleSortChange}
            .value=${this.sortBy}
          >
            <option value="default">Default</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        <div class="results-count">
          ${filteredCars.length} ${filteredCars.length === 1 ? "car" : "cars"}
        </div>
      </div>

      <ul class="grid-cards">
        ${filteredCars.map(
          (car) => html`
            <li class="car-card">
              <car-model-card
                icon="${car.icon}"
                href="/app/models/${car.slug}"
                .image="${car.image || null}"
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

    .filters-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-lg);
      align-items: center;
      margin-bottom: var(--space-xl);
      padding: var(--space-lg);
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border-muted);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-xs);
      flex: 1;
      min-width: 150px;
    }

    .filter-group label {
      font-size: var(--fs-300);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .filter-select {
      padding: var(--space-sm) var(--space-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-bg);
      color: var(--color-text);
      font-size: var(--fs-400);
      font-family: inherit;
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .filter-select:hover {
      border-color: var(--color-accent);
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-light);
    }

    .results-count {
      margin-left: auto;
      font-size: var(--fs-400);
      color: var(--color-text-muted);
      font-weight: var(--font-weight-medium);
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

      .filters-container {
        flex-wrap: nowrap;
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
