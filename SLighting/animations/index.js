export { playTorchIgnite, playTorchPileFlame } from "./torch.js";
export { playLampIgnite } from "./lamp.js";
export { playCandleIgnite, playCandlePileFlame } from "./candle.js";

import { playTorchIgnite, playTorchPileFlame } from "./torch.js";
import { playLampIgnite } from "./lamp.js";
import { playCandleIgnite, playCandlePileFlame } from "./candle.js";
import { SUBTYPES } from "../constants.js";

/**
 * Карта анимаций по подтипам
 */
export const ANIMATIONS = {
  [SUBTYPES.TORCH]: {
    ignite: playTorchIgnite,
    pile: playTorchPileFlame,
  },
  [SUBTYPES.LAMP]: {
    ignite: playLampIgnite,
    pile: null,
  },
  [SUBTYPES.CANDLE]: {
    ignite: playCandleIgnite,
    pile: playCandlePileFlame,
  },
  [SUBTYPES.HOODED]: {
    ignite: playLampIgnite,
    pile: null,
  },
  [SUBTYPES.BULLSEYE]: {
    ignite: playLampIgnite,
    pile: null,
  },
};

/**
 * Воспроизвести анимацию поджига
 */
export async function playIgniteAnimation(token, subtype) {
  const animation = ANIMATIONS[subtype]?.ignite;
  if (animation) {
    await animation(token, subtype);
  }
}

/**
 * Воспроизвести анимацию на item pile
 */
export async function playPileAnimation(tokenData, subtype) {
  const animation = ANIMATIONS[subtype]?.pile;
  if (animation) {
    await animation(tokenData, subtype);
  }
}