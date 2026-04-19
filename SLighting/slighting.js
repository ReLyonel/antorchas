import { registerSettings, registerConsumableTypes } from "./settings.js";
import { handleToggleLight } from "./handlers.js";
import { registerItemSheetHooks } from "./ui.js";
import { injectStyles } from "./styles.js";
import { checkAndRunMigration } from "./migration.js";
import { MODULE_ID } from "./constants.js";

function checkDependencies() {
  const required = ["ATL", "sequencer"];
  const optional = ["item-piles", "jb2a_patreon"];

  for (const moduleId of required) {
    if (!game.modules.get(moduleId)?.active) {
      console.error(`SLighting | Missing required module: ${moduleId}`);
    }
  }

  for (const moduleId of optional) {
    if (!game.modules.get(moduleId)?.active) {
      console.log(`SLighting | Optional module not active: ${moduleId}`);
    }
  }
}

Hooks.once("init", () => {
  console.log("SLighting | Initializing lighting system");
  registerSettings();
  injectStyles();
});

Hooks.once("ready", async () => {
  registerConsumableTypes();
  registerItemSheetHooks();
  checkDependencies();
  await checkAndRunMigration();
});

Hooks.on("dnd5e.postUseActivity", async (activity, usageConfig, results) => {
  await handleToggleLight(activity);
});

export const SLightingAPI = {
  async toggleLight(activity) {
    return handleToggleLight(activity);
  },

  isLightSource(item) {
    return item?.type === "consumable" && item?.system?.type?.value === "lighting";
  },

  getLightingEffect(actor, subtype = null) {
    return actor.appliedEffects.find((e) => {
      const flags = e.flags["sweety-lighting"];
      if (!flags) return false;
      if (subtype) return flags.source === subtype;
      return true;
    });
  },

  async runMigration() {
    const { migrateWorld } = await import("./migration.js");
    return migrateWorld();
  },
};

export { handleToggleLight as ToggleLight };