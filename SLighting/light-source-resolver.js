import { MODULE_ID, SUBTYPES } from "./constants.js";

const TORCH_IDENTIFIERS = new Set(["torch"]);
const TORCH_NAME_WORDS = new Set(["torch", "antorcha"]);

/**
 * Normaliza texto para comparación semántica segura:
 * - Minúsculas
 * - Remueve diacríticos (NFD + stripping)
 * - Compacta espacios
 */
export function normalizeVisibleName(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAntorchasLightFlag(item) {
  const lightFlag = item?.flags?.[MODULE_ID]?.light;
  if (!lightFlag || typeof lightFlag !== "object") return false;

  const subtype = lightFlag.subtype ?? item?.system?.type?.subtype ?? SUBTYPES.TORCH;
  return subtype === SUBTYPES.TORCH;
}

function isLightingTorchSubtype(item) {
  return (
    item?.system?.type?.value === "lighting" &&
    item?.system?.type?.subtype === SUBTYPES.TORCH
  );
}

function hasTorchIdentifier(item) {
  const identifier = String(item?.system?.identifier ?? "").trim().toLowerCase();
  return TORCH_IDENTIFIERS.has(identifier);
}

function hasTorchLikeVisibleName(item) {
  const normalized = normalizeVisibleName(item?.name);
  if (!normalized) return false;

  const words = new Set(normalized.split(/[\s-]+/).filter(Boolean));
  for (const token of TORCH_NAME_WORDS) {
    if (words.has(token)) return true;
  }
  return false;
}

/**
 * Resuelve si un item es fuente de luz tipo antorcha,
 * respetando el orden de detección requerido:
 *   1) flags.antorchas.light
 *   2) system.type: lighting + subtype: torch
 *   3) system.identifier: torch
 *   4) fallback por nombre visible normalizado
 */
export function resolveLightSource(item) {
  if (!item || typeof item !== "object") {
    return { isLightSource: false, subtype: null, reason: "invalid-item" };
  }

  if (hasAntorchasLightFlag(item)) {
    return { isLightSource: true, subtype: SUBTYPES.TORCH, reason: "flags.antorchas.light" };
  }

  if (isLightingTorchSubtype(item)) {
    return { isLightSource: true, subtype: SUBTYPES.TORCH, reason: "system.type.lighting.torch" };
  }

  if (hasTorchIdentifier(item)) {
    return { isLightSource: true, subtype: SUBTYPES.TORCH, reason: "system.identifier.torch" };
  }

  if (hasTorchLikeVisibleName(item)) {
    return { isLightSource: true, subtype: SUBTYPES.TORCH, reason: "name-fallback" };
  }

  return { isLightSource: false, subtype: null, reason: "unresolved" };
}

export function isTorchLike(item) {
  return resolveLightSource(item).isLightSource;
}
