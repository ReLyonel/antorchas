import { MODULE_ID, FLAG_NAMESPACE, CONSUMABLE_TYPE, SUBTYPE_DEFAULTS } from "./constants.js";

const OLD_FLAG_NAMESPACE = "sweety-lighting";
const OLD_CONSUMABLE_TYPE = "lightning";

const OLD_SUBTYPE_MAPPING = {
  torch: "torch",
  lamp: "lamp",
  candle: "candle",
  hooded: "hooded",
  bullseye: "bullseye",
  lantern: "lamp",
  "hooded lantern": "hooded",
  "bullseye lantern": "bullseye",
};

function normalizeSubtype(oldSubtype) {
  if (!oldSubtype) return "torch";
  const normalized = oldSubtype.toLowerCase().trim();
  return OLD_SUBTYPE_MAPPING[normalized] ?? "torch";
}

function extractLightConfigFromEffect(effect) {
  const config = {};
  
  if (!effect.changes) return null;

  for (const change of effect.changes) {
    const key = change.key;
    const value = change.value;

    if (key === "ATL.light.dim") {
      config.dim = parseFloat(value) || null;
    } else if (key === "ATL.light.bright") {
      config.bright = parseFloat(value) || null;
    } else if (key === "ATL.light.alpha") {
      config.alpha = parseFloat(value) || null;
    } else if (key === "ATL.light.angle") {
      config.angle = parseFloat(value) || null;
    } else if (key === "ATL.light.luminosity") {
      config.luminosity = parseFloat(value) || null;
    } else if (key === "ATL.light.color") {
      config.color = value || null;
    } else if (key === "ATL.light.attenuation") {
      config.attenuation = parseFloat(value) || null;
    } else if (key === "ATL.light.contrast") {
      config.contrast = parseFloat(value) || null;
    } else if (key === "ATL.light.shadows") {
      config.shadows = parseFloat(value) || null;
    } else if (key === "ATL.light.animation") {
      try {
        const animData = typeof value === "string" ? JSON.parse(value.replace(/'/g, '"')) : value;
        if (animData.type) config.animationType = animData.type;
        if (animData.speed) config.animationSpeed = animData.speed;
        if (animData.intensity) config.animationIntensity = animData.intensity;
      } catch (e) {
      }
    }
  }

  const hasValues = Object.values(config).some(v => v !== null);
  return hasValues ? config : null;
}

function buildLightConfigForSubtype(subtype, extractedConfig = null) {
  const defaults = SUBTYPE_DEFAULTS[subtype] ?? SUBTYPE_DEFAULTS.torch;
  
  if (!extractedConfig) {
    return { ...defaults };
  }

  return {
    dim: extractedConfig.dim ?? defaults.dim,
    bright: extractedConfig.bright ?? defaults.bright,
    alpha: extractedConfig.alpha ?? defaults.alpha,
    angle: extractedConfig.angle ?? defaults.angle,
    luminosity: extractedConfig.luminosity ?? defaults.luminosity,
    color: extractedConfig.color ?? defaults.color,
    animationType: extractedConfig.animationType ?? defaults.animationType,
    animationSpeed: extractedConfig.animationSpeed ?? defaults.animationSpeed,
    animationIntensity: extractedConfig.animationIntensity ?? defaults.animationIntensity,
    attenuation: extractedConfig.attenuation ?? defaults.attenuation,
    contrast: extractedConfig.contrast ?? defaults.contrast,
    shadows: extractedConfig.shadows ?? defaults.shadows,
  };
}

async function migrateActor(actor, itemLightConfigs = new Map()) {
  let migrated = false;

  const effectUpdates = [];
  const effectsToMigrate = actor.effects.filter(
    (e) => e.flags?.[OLD_FLAG_NAMESPACE] || e.flags?.["slightning"]
  );

  for (const effect of effectsToMigrate) {
    const oldFlags = effect.flags?.[OLD_FLAG_NAMESPACE] || effect.flags?.["slightning"];
    if (!oldFlags) continue;

    const oldSubtype = oldFlags.source;
    const newSubtype = normalizeSubtype(oldSubtype);
    
    const extractedConfig = extractLightConfigFromEffect(effect);
    
    const itemId = effect.origin?.split(".").pop();
    if (itemId && extractedConfig) {
      itemLightConfigs.set(itemId, {
        subtype: newSubtype,
        config: extractedConfig,
      });
    }

    const updateData = {
      _id: effect.id,
      [`flags.${FLAG_NAMESPACE}`]: {
        source: newSubtype,
        hooded: oldFlags.hooded ?? false,
      },
      [`flags.-=${OLD_FLAG_NAMESPACE}`]: null,
      "flags.-=slightning": null,
    };

    effectUpdates.push(updateData);
    migrated = true;
  }

  if (effectUpdates.length > 0) {
    await actor.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
  }

  return migrated;
}

async function migrateItem(item, lightConfigOverride = null) {
  let migrated = false;
  const updateData = {};

  const isOldLightingType = item.type === "consumable" && item.system?.type?.value === OLD_CONSUMABLE_TYPE;
  
  if (isOldLightingType) {
    updateData["system.type.value"] = CONSUMABLE_TYPE;
    migrated = true;
  }

  const oldFlags = item.flags?.[OLD_FLAG_NAMESPACE] || item.flags?.["slightning"];
  if (oldFlags) {
    updateData[`flags.-=${OLD_FLAG_NAMESPACE}`] = null;
    updateData["flags.-=slightning"] = null;
    migrated = true;
  }

  if (isOldLightingType || oldFlags) {
    const subtype = item.system?.type?.subtype ?? normalizeSubtype(oldFlags?.source);
    const normalizedSubtype = normalizeSubtype(subtype);
    
    if (item.system?.type?.subtype !== normalizedSubtype) {
      updateData["system.type.subtype"] = normalizedSubtype;
    }

    const existingLightConfig = item.flags?.[MODULE_ID]?.light;
    if (!existingLightConfig) {
      const lightConfig = lightConfigOverride 
        ? buildLightConfigForSubtype(normalizedSubtype, lightConfigOverride)
        : buildLightConfigForSubtype(normalizedSubtype);
      
      updateData[`flags.${MODULE_ID}.light`] = lightConfig;
    }
    
    migrated = true;
  }

  if (migrated) {
    await item.update(updateData);
  }

  return migrated;
}

async function migrateWorld() {
  const startTime = Date.now();
  let actorCount = 0;
  let itemCount = 0;
  let tokenCount = 0;

  console.log("SLighting | Starting migration...");

  for (const actor of game.actors) {
    const itemLightConfigs = new Map();
    
    const actorMigrated = await migrateActor(actor, itemLightConfigs);
    if (actorMigrated) actorCount++;

    for (const item of actor.items) {
      const configOverride = itemLightConfigs.get(item.id)?.config;
      const itemMigrated = await migrateItem(item, configOverride);
      if (itemMigrated) itemCount++;
    }
  }

  for (const item of game.items) {
    const itemMigrated = await migrateItem(item);
    if (itemMigrated) itemCount++;
  }

  for (const scene of game.scenes) {
    for (const tokenDoc of scene.tokens) {
      if (!tokenDoc.actor) continue;

      const itemLightConfigs = new Map();
      
      const effectsToMigrate = tokenDoc.actor.effects.filter(
        (e) => e.flags?.[OLD_FLAG_NAMESPACE] || e.flags?.["slightning"]
      );

      if (effectsToMigrate.length === 0) continue;

      const effectUpdates = [];

      for (const effect of effectsToMigrate) {
        const oldFlags = effect.flags?.[OLD_FLAG_NAMESPACE] || effect.flags?.["slightning"];
        if (!oldFlags) continue;

        const oldSubtype = oldFlags.source;
        const newSubtype = normalizeSubtype(oldSubtype);
        
        const extractedConfig = extractLightConfigFromEffect(effect);
        
        const itemId = effect.origin?.split(".").pop();
        if (itemId && extractedConfig) {
          itemLightConfigs.set(itemId, {
            subtype: newSubtype,
            config: extractedConfig,
          });
        }

        effectUpdates.push({
          _id: effect.id,
          [`flags.${FLAG_NAMESPACE}`]: {
            source: newSubtype,
            hooded: oldFlags.hooded ?? false,
          },
          [`flags.-=${OLD_FLAG_NAMESPACE}`]: null,
          "flags.-=slightning": null,
        });
        tokenCount++;
      }

      if (effectUpdates.length > 0) {
        await tokenDoc.actor.updateEmbeddedDocuments("ActiveEffect", effectUpdates);
      }

      for (const item of tokenDoc.actor.items) {
        const configOverride = itemLightConfigs.get(item.id)?.config;
        if (configOverride || item.system?.type?.value === OLD_CONSUMABLE_TYPE) {
          const itemMigrated = await migrateItem(item, configOverride);
          if (itemMigrated) itemCount++;
        }
      }
    }
  }

  for (const pack of game.packs) {
    if (pack.documentName !== "Actor" && pack.documentName !== "Item") continue;
    if (pack.locked) continue;

    const documents = await pack.getDocuments();

    for (const doc of documents) {
      if (doc.documentName === "Actor") {
        const itemLightConfigs = new Map();
        
        const actorMigrated = await migrateActor(doc, itemLightConfigs);
        if (actorMigrated) actorCount++;

        for (const item of doc.items) {
          const configOverride = itemLightConfigs.get(item.id)?.config;
          const itemMigrated = await migrateItem(item, configOverride);
          if (itemMigrated) itemCount++;
        }
      } else if (doc.documentName === "Item") {
        const itemMigrated = await migrateItem(doc);
        if (itemMigrated) itemCount++;
      }
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`SLighting | Migration completed in ${duration}s`);
  console.log(`SLighting | Migrated: ${actorCount} actors, ${itemCount} items, ${tokenCount} token effects`);

  return { actorCount, itemCount, tokenCount, duration };
}

async function needsMigration() {
  for (const actor of game.actors) {
    const hasOldFlags = actor.effects.some(
      (e) => e.flags?.[OLD_FLAG_NAMESPACE] || e.flags?.["slightning"]
    );
    if (hasOldFlags) return true;

    for (const item of actor.items) {
      if (item.type === "consumable" && item.system?.type?.value === OLD_CONSUMABLE_TYPE) {
        return true;
      }
      if (item.flags?.[OLD_FLAG_NAMESPACE] || item.flags?.["slightning"]) {
        return true;
      }
    }
  }

  for (const item of game.items) {
    if (item.type === "consumable" && item.system?.type?.value === OLD_CONSUMABLE_TYPE) {
      return true;
    }
    if (item.flags?.[OLD_FLAG_NAMESPACE] || item.flags?.["slightning"]) {
      return true;
    }
  }

  return false;
}

export async function checkAndRunMigration() {
  if (!game.user.isGM) return;

  const migrationVersion = game.settings.get(MODULE_ID, "migrationVersion") ?? "0.0.0";
  const currentVersion = "1.0.0";

  if (migrationVersion === currentVersion) return;

  const needs = await needsMigration();

  if (!needs) {
    await game.settings.set(MODULE_ID, "migrationVersion", currentVersion);
    return;
  }

  const confirm = await Dialog.confirm({
    title: game.i18n.localize("SLighting.Migration.Title"),
    content: `
      <p>${game.i18n.localize("SLighting.Migration.Content")}</p>
      <p><strong>${game.i18n.localize("SLighting.Migration.Warning")}</strong></p>
    `,
    yes: () => true,
    no: () => false,
    defaultYes: false,
  });

  if (!confirm) return;

  ui.notifications.info(game.i18n.localize("SLighting.Migration.Started"));

  try {
    const result = await migrateWorld();

    await game.settings.set(MODULE_ID, "migrationVersion", currentVersion);

    ui.notifications.info(
      game.i18n.format("SLighting.Migration.Completed", {
        actors: result.actorCount,
        items: result.itemCount,
        tokens: result.tokenCount,
        duration: result.duration,
      })
    );
  } catch (error) {
    console.error("SLighting | Migration failed:", error);
    ui.notifications.error(game.i18n.localize("SLighting.Migration.Failed"));
  }
}

export { migrateWorld };