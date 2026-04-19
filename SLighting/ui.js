import { MODULE_ID, CONSUMABLE_TYPE, SUBTYPE_DEFAULTS } from "./constants.js";
import { resolveLightSource } from "./light-source-resolver.js";

const ANIMATION_TYPES = {
  "": "None",
  torch: "LIGHT.AnimationTorch",
  flame: "LIGHT.AnimationFlame",
  pulse: "LIGHT.AnimationPulse",
  reactivepulse: "LIGHT.AnimationReactivePulse",
  chroma: "LIGHT.AnimationChroma",
  wave: "LIGHT.AnimationWave",
  fog: "LIGHT.AnimationFog",
  sunburst: "LIGHT.AnimationSunburst",
  dome: "LIGHT.AnimationLightDome",
  emanation: "LIGHT.AnimationEmanation",
  energy: "LIGHT.AnimationEnergyField",
  hexa: "LIGHT.AnimationHexaDome",
  ghost: "LIGHT.AnimationGhostLight",
  roiling: "LIGHT.AnimationRoilingMass",
  hole: "LIGHT.AnimationBlackHole",
  vortex: "LIGHT.AnimationVortex",
  witchwave: "LIGHT.AnimationBewitchingWave",
  rainbowswirl: "LIGHT.AnimationSwirlingRainbow",
  radialrainbow: "LIGHT.AnimationRadialRainbow",
  fairy: "LIGHT.AnimationFairyLight",
  grid: "LIGHT.AnimationForceGrid",
  starlight: "LIGHT.AnimationStarLight",
  smokepatch: "LIGHT.AnimationSmokePatch",
  revolving: "LIGHT.AnimationRevolving",
  siren: "LIGHT.AnimationSiren",
  magicalgloom: "LIGHT.AnimationMagicalGloom",
  densesmoke: "LIGHT.AnimationDenseSmoke",
};

function isLightingConsumable(item) {
  if (!item || item.type !== "consumable") return false;

  if (item.system?.type?.value === CONSUMABLE_TYPE) return true;
  if (String(item.system?.identifier ?? "").trim().toLowerCase() === "torch") return true;

  return resolveLightSource(item).isLightSource;
}

function getLightConfig(item, subtypeOverride = null) {
  const flags = item.flags?.[MODULE_ID]?.light ?? {};
  const subtype = subtypeOverride ?? item.system?.type?.subtype ?? "torch";
  const defaults = SUBTYPE_DEFAULTS[subtype] ?? SUBTYPE_DEFAULTS.torch;

  return {
    dim: flags.dim ?? defaults.dim,
    bright: flags.bright ?? defaults.bright,
    alpha: flags.alpha ?? defaults.alpha,
    angle: flags.angle ?? defaults.angle,
    luminosity: flags.luminosity ?? defaults.luminosity,
    color: flags.color ?? defaults.color,
    animationType: flags.animationType ?? defaults.animationType,
    animationSpeed: flags.animationSpeed ?? defaults.animationSpeed,
    animationIntensity: flags.animationIntensity ?? defaults.animationIntensity,
    attenuation: flags.attenuation ?? defaults.attenuation,
    contrast: flags.contrast ?? defaults.contrast,
    shadows: flags.shadows ?? defaults.shadows,
  };
}

function createRangeGroup(label, name, value, min, max, step, disabledAttr) {
  return `
    <div class="form-group">
      <label>${label}</label>
      <div class="form-fields">
        <input type="range" name="${name}" 
               value="${value}" min="${min}" max="${max}" step="${step}" ${disabledAttr}
               data-slighting-range>
        <input type="number" 
               value="${value}" min="${min}" max="${max}" step="${step}" ${disabledAttr}
               data-slighting-number data-target="${name}">
      </div>
    </div>
  `;
}


function createToggleLightButton(item, isEditable) {
  if (!isEditable) return null;

  const wrapper = document.createElement("div");
  wrapper.classList.add("form-group", "slighting-toggle");

  const button = document.createElement("button");
  button.type = "button";
  button.classList.add("slighting-toggle-button");
  button.textContent = game.i18n.localize("SLighting.Actions.ToggleLight");

  button.addEventListener("click", async () => {
    const api = game.modules.get("antorchas")?.api;
    if (!api?.toggleLightFromItem) {
      ui.notifications.warn("Antorchas | API no disponible.");
      return;
    }

    await api.toggleLightFromItem(item, { actor: item.actor ?? null });
  });

  wrapper.appendChild(button);
  return wrapper;
}

function createLightingFieldset(item, isEditable) {
  const config = getLightConfig(item);
  const disabledAttr = isEditable ? "" : "disabled";
  const prefix = `flags.${MODULE_ID}.light`;

  const animationOptions = Object.entries(ANIMATION_TYPES)
    .map(([value, label]) => {
      const selected = config.animationType === value ? "selected" : "";
      const localizedLabel = game.i18n.localize(label);
      return `<option value="${value}" ${selected}>${localizedLabel}</option>`;
    })
    .join("");

  const html = `
    <fieldset>
      <legend>${game.i18n.localize("SLighting.Config.Title")}</legend>
      
      <div class="form-group">
        <label>${game.i18n.localize("SLighting.Config.LightRadius")}</label>
        <div class="form-fields">
          <label class="checkbox">
            ${game.i18n.localize("SLighting.Fields.dim")}
            <input type="number" name="${prefix}.dim" 
                   value="${config.dim}" min="0" step="5" ${disabledAttr}>
          </label>
          <label class="checkbox">
            ${game.i18n.localize("SLighting.Fields.bright")}
            <input type="number" name="${prefix}.bright" 
                   value="${config.bright}" min="0" step="5" ${disabledAttr}>
          </label>
          <label class="checkbox">
            ${game.i18n.localize("SLighting.Fields.angle")}
            <input type="number" name="${prefix}.angle" 
                   value="${config.angle}" min="0" max="360" step="5" ${disabledAttr}>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>${game.i18n.localize("SLighting.Fields.color")}</label>
        <div class="form-fields">
          <input type="color" name="${prefix}.color" 
                 value="${config.color}" ${disabledAttr}>
        </div>
      </div>

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.alpha"),
        `${prefix}.alpha`, config.alpha, 0, 1, 0.05, disabledAttr
      )}

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.luminosity"),
        `${prefix}.luminosity`, config.luminosity, 0, 1, 0.05, disabledAttr
      )}

      <div class="form-group">
        <label>${game.i18n.localize("SLighting.Fields.animationType")}</label>
        <div class="form-fields">
          <select name="${prefix}.animationType" ${disabledAttr}>
            ${animationOptions}
          </select>
        </div>
      </div>

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.animationSpeed"),
        `${prefix}.animationSpeed`, config.animationSpeed, 1, 10, 1, disabledAttr
      )}

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.animationIntensity"),
        `${prefix}.animationIntensity`, config.animationIntensity, 1, 10, 1, disabledAttr
      )}

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.attenuation"),
        `${prefix}.attenuation`, config.attenuation, 0, 1, 0.05, disabledAttr
      )}

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.contrast"),
        `${prefix}.contrast`, config.contrast, 0, 1, 0.05, disabledAttr
      )}

      ${createRangeGroup(
        game.i18n.localize("SLighting.Fields.shadows"),
        `${prefix}.shadows`, config.shadows, 0, 1, 0.05, disabledAttr
      )}
    </fieldset>
  `;

  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

function attachLinkedInputListeners(fieldset) {
  const rangeInputs = fieldset.querySelectorAll("[data-slighting-range]");
  const numberInputs = fieldset.querySelectorAll("[data-slighting-number]");

  rangeInputs.forEach((range) => {
    const name = range.getAttribute("name");
    const number = fieldset.querySelector(`[data-target="${name}"]`);
    
    if (number) {
      range.addEventListener("input", () => {
        number.value = range.value;
      });
    }
  });

  numberInputs.forEach((number) => {
    const targetName = number.dataset.target;
    const range = fieldset.querySelector(`[name="${targetName}"]`);
    
    if (range) {
      number.addEventListener("input", () => {
        range.value = number.value;
      });

      number.addEventListener("change", () => {
        range.value = number.value;
        range.dispatchEvent(new Event("change", { bubbles: true }));
      });
    }
  });
}

function injectLightingFieldset(container, item, isEditable) {
  if (!container || !item) return;
  if (!isLightingConsumable(item)) return;
  if (container.querySelector(".slighting-config")) return;

  const fieldset = createLightingFieldset(item, isEditable);
  fieldset.classList.add("slighting-config");

  const toggleButton = createToggleLightButton(item, isEditable);
  if (toggleButton) {
    fieldset.prepend(toggleButton);
  }

  const detailsSection = container.querySelector('.tab[data-tab="details"]');
  if (detailsSection) {
    const existingFieldsets = detailsSection.querySelectorAll("fieldset");
    if (existingFieldsets.length > 0) {
      existingFieldsets[existingFieldsets.length - 1].after(fieldset);
    } else {
      detailsSection.appendChild(fieldset);
    }
  } else {
    const form = container.querySelector("form");
    if (form) {
      form.appendChild(fieldset);
    }
  }

  attachLinkedInputListeners(fieldset);
}

function updateFieldsetVisibility(container, item) {
  if (!container || !item) return;

  const fieldset = container.querySelector(".slighting-config");
  const shouldShow = isLightingConsumable(item);

  if (shouldShow && !fieldset) {
    const isEditable = container.classList.contains("editable");
    injectLightingFieldset(container, item, isEditable);
  } else if (!shouldShow && fieldset) {
    fieldset.remove();
  }
}

function getHtmlElement(html) {
  if (html instanceof HTMLElement) return html;
  if (html instanceof jQuery) return html[0];
  if (html?.element instanceof HTMLElement) return html.element;
  if (html?.element instanceof jQuery) return html.element[0];
  if (Array.isArray(html)) return html[0];
  return html;
}

export function initializeItemSheetUI(app, html, item) {
  if (!item || item.type !== "consumable") return;

  const container = getHtmlElement(html);
  if (!container) return;

  const isEditable = container.classList.contains("editable");

  injectLightingFieldset(container, item, isEditable);

  const typeSelect = container.querySelector('select[name="system.type.value"]');
  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      setTimeout(() => {
        const updatedItem = app.item ?? app.document ?? app.object;
        updateFieldsetVisibility(container, updatedItem);
      }, 50);
    });
  }

  const subtypeSelect = container.querySelector('select[name="system.type.subtype"]');
  if (subtypeSelect) {
    subtypeSelect.addEventListener("change", () => {
      setTimeout(() => {
        const updatedItem = app.item ?? app.document ?? app.object;
        updateFieldsetVisibility(container, updatedItem);
      }, 50);
    });
  }
}

export function registerItemSheetHooks() {
  Hooks.on("renderItemSheet", (app, html, data) => {
    const item = app.item ?? app.document ?? app.object;
    initializeItemSheetUI(app, html, item);
  });

  Hooks.on("renderItemSheet5e", (app, html, data) => {
    const item = app.item ?? app.document ?? app.object;
    initializeItemSheetUI(app, html, item);
  });
}

export { getLightConfig, SUBTYPE_DEFAULTS };