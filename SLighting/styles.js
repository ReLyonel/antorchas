import { MODULE_ID } from "./constants.js";

export function injectStyles() {
  const existingStyle = document.getElementById(`${MODULE_ID}-slighting-styles`);
  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = `${MODULE_ID}-slighting-styles`;
  style.textContent = `
    .slighting-config .form-fields {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .slighting-config input[type="range"] {
      flex: 1;
    }

    .slighting-config input[type="number"] {
      width: 60px;
      text-align: center;
    }

    .slighting-config input[type="color"] {
      width: 100%;
      height: 28px;
      padding: 2px;
      cursor: pointer;
    }

    .slighting-config .checkbox {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .slighting-config .checkbox input[type="number"] {
      width: 50px;
    }

    .slighting-hidden {
      display: none !important;
    }

    .slighting-toggle {
      margin-bottom: 0.5rem;
    }

    .slighting-toggle-button {
      width: 100%;
      min-height: 30px;
    }
  `;

  document.head.appendChild(style);
}