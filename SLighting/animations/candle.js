import { ASSETS } from "../constants.js";

/**
 * Проверка наличия JB2A Patreon
 */
function hasJB2APatreon() {
  return game.modules.get("jb2a_patreon")?.active ?? false;
}

/**
 * Получение offset для автоповорота
 */
function getAutoRotateOffset(token) {
  return token.document.flags?.autorotate?.offset ?? 0;
}

/**
 * Получение масштаба спрайта
 */
function getSpriteScale(token, scale = 1.0) {
  return {
    x: scale / token.document.texture.scaleX,
    y: scale / token.document.texture.scaleY,
  };
}

/**
 * Анимация поджига свечи
 */
export async function playCandleIgnite(token, subtype) {
  const torchOffsetX = 0.41 * token.document.width;
  const flameOffsetX = 0.43 * token.document.width;
  const lightImg = ASSETS.candle.item;
  const rotateOffset = getAutoRotateOffset(token);

  try {
    await new Sequence()
      // Эффект вспышки
      .effect()
      .delay(150)
      .name(subtype)
      .file(hasJB2APatreon() ? "jb2a.impact.002.orange" : "")
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(0.9, { considerTokenScale: true })
      .spriteOffset(
        { x: 0.525 * token.document.width, y: -0.05 * token.document.width },
        { gridUnits: true }
      )
      .spriteRotation(45)
      .zIndex(0.1)
      .rotate(rotateOffset)
      .spriteScale(getSpriteScale(token))

      // Спрайт свечи
      .effect()
      .name(subtype)
      .file(lightImg)
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(1, { considerTokenScale: true })
      .scaleIn(0, 500, { ease: "easeOutElastic" })
      .scaleOut(0, 250, { ease: "easeOutCubic" })
      .spriteOffset({ x: torchOffsetX, y: 0.1 * token.document.width }, { gridUnits: true })
      .animateProperty("sprite", "rotation", {
        from: 60,
        to: -60,
        duration: 300,
        ease: "easeInOutBack",
      })
      .animateProperty("sprite", "rotation", {
        from: 0,
        to: 30,
        duration: 250,
        delay: 200,
        ease: "easeOutBack",
      })
      .persist()
      .rotate(rotateOffset)
      .spriteScale(getSpriteScale(token, 0.5))

      // Пламя свечи
      .effect()
      .delay(250)
      .name(subtype)
      .file("jb2a.flames.04.loop.orange")
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(0.4, { considerTokenScale: true })
      .spriteOffset(
        { x: flameOffsetX, y: -0.12 * token.document.width },
        { gridUnits: true }
      )
      .persist()
      .rotate(rotateOffset)
      .spriteScale(getSpriteScale(token))
      .zIndex(0.1)
      .waitUntilFinished()
      .play();
  } catch (error) {
    console.error("SLighting: Candle ignite animation failed:", error);
  }
}

/**
 * Анимация пламени свечи на item pile
 */
export async function playCandlePileFlame(tokenData, subtype) {
  try {
    await new Sequence()
      .effect()
      .delay(250)
      .name(`${subtype}_ip`)
      .file("jb2a.flames.04.loop.orange")
      .atLocation(tokenData)
      .attachTo(tokenData, { bindRotation: true, local: true })
      .scaleToObject(0.3, { considerTokenScale: true })
      .spriteOffset(
        { x: 0.01, y: -0.1 * tokenData.document.width },
        { gridUnits: true }
      )
      .persist()
      .spriteRotation(0)
      .zIndex(0.1)
      .waitUntilFinished()
      .play();
  } catch (error) {
    console.error("SLighting: Candle pile animation failed:", error);
  }
}