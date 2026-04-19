import { MODULE_ID, SUBTYPES } from "./constants.js";
import { getLightConfig } from "./ui.js";
import { resolveLightSource } from "./light-source-resolver.js";

const ACTIVE_LIGHT_FLAG = "activeLight";

function getActorFromActivity(activity) {
  return activity?.parent?.parent?.parent ?? null;
}

function getItemFromActivity(activity) {
  return activity?.parent?.parent ?? null;
}

function resolveTokenForActor(actor, preferredToken = null) {
  if (preferredToken) return preferredToken;
  if (!actor) return null;

  const controlled = canvas.tokens?.controlled?.find((t) => t.actor?.id === actor.id);
  if (controlled) return controlled;

  const active = actor.getActiveTokens?.(true, true)?.[0];
  if (active) return active;

  return canvas.tokens?.placeables?.find((t) => t.actor?.id === actor.id) ?? null;
}

function ensureCanUpdateToken(token) {
  if (!token?.document) return false;
  if (game.user?.isGM) return true;
  return token.document.canUserModify?.(game.user, "update") ?? false;
}

function buildLightUpdateFromConfig(config, subtype) {
  const isBullseye = subtype === SUBTYPES.BULLSEYE;

  return {
    "light.dim": Number(config.dim ?? 40),
    "light.bright": Number(config.bright ?? 20),
    "light.angle": Number(config.angle ?? (isBullseye ? 60 : 360)),
    "light.alpha": Number(config.alpha ?? 0.25),
    "light.luminosity": Number(config.luminosity ?? 0.5),
    "light.color": config.color ?? "#ffb433",
    "light.attenuation": Number(config.attenuation ?? 0.75),
    "light.contrast": Number(config.contrast ?? 0.15),
    "light.shadows": Number(config.shadows ?? 0.2),
    "light.animation.type": config.animationType ?? "torch",
    "light.animation.speed": Number(config.animationSpeed ?? 2),
    "light.animation.intensity": Number(config.animationIntensity ?? 4),
  };
}

function buildOffUpdate() {
  return {
    "light.dim": 0,
    "light.bright": 0,
    "light.animation.type": null,
  };
}

function getSourceKey(item, resolvedSource) {
  return (
    item?.uuid ||
    item?.id ||
    item?.system?.identifier ||
    `${resolvedSource?.subtype ?? "torch"}:${item?.name ?? "unknown"}`
  );
}

function getActiveLightState(tokenDocument) {
  return tokenDocument.getFlag(MODULE_ID, ACTIVE_LIGHT_FLAG) ?? null;
}

async function setActiveLightState(tokenDocument, state) {
  await tokenDocument.setFlag(MODULE_ID, ACTIVE_LIGHT_FLAG, state);
}

async function clearActiveLightState(tokenDocument) {
  await tokenDocument.unsetFlag(MODULE_ID, ACTIVE_LIGHT_FLAG);
}

function normalizeInput(input) {
  if (input?.activity || input?.item || input?.actor || input?.token) return input;

  // Compatibilidad hacia atrás: si recibimos activity directamente
  return { activity: input };
}

function resolveSourceContext(input) {
  const normalized = normalizeInput(input);
  const activity = normalized.activity ?? null;

  const item = normalized.item ?? getItemFromActivity(activity);
  const actor = normalized.actor ?? item?.actor ?? getActorFromActivity(activity);
  const token = resolveTokenForActor(actor, normalized.token ?? null);

  return { item, actor, token };
}

async function toggleTokenLight({ item, actor, token }) {
  if (!token) {
    ui.notifications.warn("Antorchas | Sin token seleccionado o disponible para el actor.");
    return false;
  }

  if (!actor) {
    ui.notifications.error("Antorchas | Actor no encontrado.");
    return false;
  }

  if (!item) {
    ui.notifications.warn("Antorchas | Item no reconocido.");
    return false;
  }

  if (!ensureCanUpdateToken(token)) {
    ui.notifications.error("Antorchas | No tienes permisos para modificar la luz de este token.");
    return false;
  }

  const resolvedSource = resolveLightSource(item);
  if (!resolvedSource.isLightSource) {
    ui.notifications.warn("Antorchas | Item no reconocido como fuente de luz.");
    return false;
  }

  const subtype = resolvedSource.subtype ?? item.system?.type?.subtype ?? SUBTYPES.TORCH;
  const sourceKey = getSourceKey(item, resolvedSource);
  const config = getLightConfig(item, subtype);

  const tokenDocument = token.document;
  const activeLight = getActiveLightState(tokenDocument);

  // Misma fuente => toggle off
  if (activeLight?.sourceKey === sourceKey) {
    await tokenDocument.update(buildOffUpdate());
    await clearActiveLightState(tokenDocument);
    return true;
  }

  // Fuente distinta del módulo => reemplazar con nueva luz
  await tokenDocument.update(buildLightUpdateFromConfig(config, subtype));
  await setActiveLightState(tokenDocument, {
    sourceKey,
    subtype,
    actorId: actor.id,
    itemUuid: item.uuid ?? null,
    at: Date.now(),
  });

  return true;
}

/**
 * API unificada:
 * - `{ activity }` desde hook `dnd5e.postUseActivity`
 * - `{ item, actor?, token? }` para flujo básico (PHB u otros)
 * - `activity` directo para compatibilidad heredada
 */
export async function handleToggleLight(input) {
  const context = resolveSourceContext(input);
  return toggleTokenLight(context);
}

export async function toggleLightFromItem(item, { actor = null, token = null } = {}) {
  return handleToggleLight({ item, actor, token });
}

export async function toggleLightFromActivity(activity) {
  return handleToggleLight({ activity });
}

export { ACTIVE_LIGHT_FLAG, buildLightUpdateFromConfig, buildOffUpdate };
