import { registerSettings, registerConsumableTypes } from "./settings.js";
import { handleToggleLight, toggleLightFromItem, toggleLightFromActivity } from "./handlers.js";
import { registerItemSheetHooks } from "./ui.js";
import { injectStyles } from "./styles.js";
import { checkAndRunMigration } from "./migration.js";
import { isTorchLike, resolveLightSource } from "./light-source-resolver.js";
import { isSystemTorchCandidate, enrichSystemTorches, runOptInTorchEnrichment } from "./system-torch-compat.js";

export const AntorchasAPI = {
  async toggleLight(activityOrInput) {
    return handleToggleLight(activityOrInput);
  },
  async toggleLightFromItem(item, options) {
    return toggleLightFromItem(item, options);
  },
  async toggleLightFromActivity(activity) {
    return toggleLightFromActivity(activity);
  },
  isTorchLike,
  resolveLightSource,
  isSystemTorchCandidate,
  enrichSystemTorches,
};

Hooks.once("init", () => {
  console.log("Antorchas | Initializing module");
  registerSettings();
  injectStyles();
});

Hooks.once("ready", async () => {
  registerConsumableTypes();
  registerItemSheetHooks();

  const thisModule = game.modules.get("antorchas");
  if (thisModule) thisModule.api = AntorchasAPI;

  await runOptInTorchEnrichment();
  await checkAndRunMigration();
});

// Compatibilidad con flujo moderno de Activities (dnd5e v4+)
Hooks.on("dnd5e.postUseActivity", async (activity) => {
  await toggleLightFromActivity(activity);
});

// Camino adicional para casos básicos (p.ej. items PHB sin activity especial)
Hooks.on("dnd5e.useItem", async (item, config, options) => {
  await toggleLightFromItem(item, { actor: item?.actor ?? null });
});

export {
  handleToggleLight as ToggleLight,
  toggleLightFromItem,
  toggleLightFromActivity,
  isTorchLike,
  resolveLightSource,
  isSystemTorchCandidate,
  enrichSystemTorches,
};
