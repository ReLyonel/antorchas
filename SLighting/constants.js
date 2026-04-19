export { MODULE_ID } from "../../constants.mjs";
export const FLAG_NAMESPACE = "sweety-lighting";

export const CONSUMABLE_TYPE = "lighting";

export const SUBTYPES = {
  TORCH: "torch",
  LAMP: "lamp",
  CANDLE: "candle",
  HOODED: "hooded",
  BULLSEYE: "bullseye",
};

export const DURATION_MULTIPLIERS = {
  turn: 2,
  round: 6,
  minute: 60,
  hour: 3600,
  day: 86400,
  month: 2592000,
  year: 31104000,
};

export const SUBTYPE_DEFAULTS = {
  torch: {
    dim: 40,
    bright: 20,
    alpha: 0.25,
    angle: 360,
    luminosity: 0.5,
    color: "#ffb433",
    animationType: "torch",
    animationSpeed: 2,
    animationIntensity: 4,
    attenuation: 0.75,
    contrast: 0.15,
    shadows: 0.2,
  },
  lamp: {
    dim: 45,
    bright: 15,
    alpha: 0.25,
    angle: 360,
    luminosity: 0.5,
    color: "#ffcc66",
    animationType: "torch",
    animationSpeed: 2,
    animationIntensity: 3,
    attenuation: 0.75,
    contrast: 0.1,
    shadows: 0.15,
  },
  candle: {
    dim: 10,
    bright: 5,
    alpha: 0.2,
    angle: 360,
    luminosity: 0.4,
    color: "#ffcc99",
    animationType: "torch",
    animationSpeed: 3,
    animationIntensity: 2,
    attenuation: 0.8,
    contrast: 0.05,
    shadows: 0.1,
  },
  hooded: {
    dim: 60,
    bright: 30,
    alpha: 0.25,
    angle: 360,
    luminosity: 0.5,
    color: "#ffcc66",
    animationType: "torch",
    animationSpeed: 2,
    animationIntensity: 3,
    attenuation: 0.75,
    contrast: 0.1,
    shadows: 0.15,
  },
  bullseye: {
    dim: 120,
    bright: 60,
    alpha: 0.3,
    angle: 60,
    luminosity: 0.6,
    color: "#ffcc66",
    animationType: "torch",
    animationSpeed: 2,
    animationIntensity: 3,
    attenuation: 0.7,
    contrast: 0.15,
    shadows: 0.2,
  },
};

export const DEFAULT_LIGHT_CONFIG = {
  alpha: "0.25",
  luminosity: "0.5",
  color: "#ffb433",
  attenuation: "0.75",
  contrast: "0.15",
  shadows: "0.2",
  animation: '{ "type": "torch", "speed": 2, "intensity": 4 }',
};

export const ASSETS = {
  torch: {
    item: "modules/fifthpendium/misc/items/torch.webp",
    tile: "modules/fifthpendium/misc/SLighting/torch.webp",
  },
  lamp: {
    item: "modules/fifthpendium/misc/items/lamp.webp",
    tile: "modules/fifthpendium/misc/SLighting/lamp.webp",
  },
  candle: {
    item: "modules/fifthpendium/misc/items/candle.webp",
    tile: "modules/fifthpendium/misc/SLighting/candle.webp",
  },
  hooded: {
    item: "modules/fifthpendium/misc/items/lamp.webp",
    tile: "modules/fifthpendium/misc/SLighting/lamp.webp",
  },
  bullseye: {
    item: "modules/fifthpendium/misc/items/lamp.webp",
    tile: "modules/fifthpendium/misc/SLighting/lamp.webp",
  },
};

export const BUTTON_STYLE = {
  width: "160px",
  height: "80px",
  margin: "5px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "16px",
  justifyContent: "center",
};