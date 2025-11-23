import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

export class CarModelDetailViewElement extends LitElement {
  @property()
  slug?: string;

  render() {
    return html`
      <car-model-detail slug=${this.slug || ""}></car-model-detail>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `;
}
