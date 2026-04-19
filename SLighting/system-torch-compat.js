import { MODULE_ID, CONSUMABLE_TYPE, SUBTYPES, SUBTYPE_DEFAULTS } from "./constants.js";

function isTorchIdentifier(item) {
  return String(item?.system?.identifier ?? "").trim().toLowerCase() === "torch";
}

/**
 * Criterio estricto para evitar tocar items personalizados no relacionados:
 * - Debe ser consumable
 * - Debe tener identifier exacto "torch"
 */
export function isSystemTorchCandidate(item) {
  if (!item || item.type !== "consumable") return false;
  return isTorchIdentifier(item);
}

function buildTorchEnrichmentUpdate(item) {
  const update = { _id: item.id };

  if (item.system?.type?.value !== CONSUMABLE_TYPE) {
    update["system.type.value"] = CONSUMABLE_TYPE;
  }

  if (item.system?.type?.subtype !== SUBTYPES.TORCH) {
    update["system.type.subtype"] = SUBTYPES.TORCH;
  }

  if (!item.flags?.[MODULE_ID]?.light) {
    update[`flags.${MODULE_ID}.light`] = { ...SUBTYPE_DEFAULTS.torch };
  }

  return update;
}

function hasActualChanges(update) {
  return Object.keys(update).length > 1;
}

async function enrichItemCollection(items) {
  const updates = [];

  for (const item of items) {
    if (!isSystemTorchCandidate(item)) continue;

    const update = buildTorchEnrichmentUpdate(item);
    if (hasActualChanges(update)) updates.push(update);
  }

  if (updates.length > 0) {
    await Item.updateDocuments(updates);
  }

  return updates.length;
}

/**
 * Enriquecimiento opt-in y no destructivo:
 * - No cambia nombre/descripcion/daño
 * - Solo ajusta type/subtype/flags.light para antorchas con identifier=torch
 */
export async function enrichSystemTorches({ notify = true } = {}) {
  const changedWorldItems = await enrichItemCollection(game.items.contents);

  let changedActorItems = 0;
  for (const actor of game.actors) {
    const updates = [];

    for (const item of actor.items) {
      if (!isSystemTorchCandidate(item)) continue;
      const update = buildTorchEnrichmentUpdate(item);
      if (hasActualChanges(update)) updates.push(update);
    }

    if (updates.length > 0) {
      await actor.updateEmbeddedDocuments("Item", updates);
      changedActorItems += updates.length;
    }
  }

  const changedTotal = changedWorldItems + changedActorItems;

  if (notify) {
    ui.notifications.info(
      game.i18n.format("SLighting.Compatibility.EnrichCompleted", {
        changed: changedTotal,
      })
    );
  }

  return { changedWorldItems, changedActorItems, changedTotal };
}

export async function runOptInTorchEnrichment() {
  if (!game.user?.isGM) return;

  const enabled = game.settings.get(MODULE_ID, "EnrichSystemTorch");
  if (!enabled) return;

  await enrichSystemTorches({ notify: true });
}
