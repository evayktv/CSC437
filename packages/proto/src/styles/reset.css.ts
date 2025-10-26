import { css } from "lit";

const styles = css`
  * {
    margin: 0;
    box-sizing: border-box;
  }

  ul,
  ol {
    padding: 0;
    margin: 0;
    list-style: none;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }

  img,
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
`;

export default { styles };
