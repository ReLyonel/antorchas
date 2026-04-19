import { MODULE_ID, CONSUMABLE_TYPE } from "./constants.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "LightTimer", {
    name: game.i18n.localize("SLighting.Settings.LightTimer.name"),
    hint: game.i18n.localize("SLighting.Settings.LightTimer.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, "migrationVersion", {
    name: "Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0",
  });
}

export function registerConsumableTypes() {
  if (!foundry?.utils) {
    console.warn("SLighting: foundry.utils not available");
    return;
  }

  try {
    foundry.utils.mergeObject(CONFIG.DND5E.consumableTypes, {
      [CONSUMABLE_TYPE]: {
        label: game.i18n.localize("SLighting.LightingSource"),
        subtypes: {
          torch: game.i18n.localize("SLighting.torch.name"),
          lamp: game.i18n.localize("SLighting.lamp.name"),
          candle: game.i18n.localize("SLighting.candle.name"),
          hooded: game.i18n.localize("SLighting.hooded.name"),
          bullseye: game.i18n.localize("SLighting.bullseye.name"),
        },
      },
    });
  } catch (error) {
    console.error("SLighting: Failed to register consumable types:", error);
  }
}