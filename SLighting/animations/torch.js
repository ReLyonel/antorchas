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
 * Получение масштаба спрайта относительно текстуры токена
 */
function getSpriteScale(token, scale = 1.0) {
  return {
    x: scale / token.document.texture.scaleX,
    y: scale / token.document.texture.scaleY,
  };
}

/**
 * Анимация поджига факела
 */
export async function playTorchIgnite(token, subtype) {
  const torchOffsetX = 0.35;
  const lightImg = ASSETS.torch.item;
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
      .spriteScale(getSpriteScale(token))
      .zIndex(0.1)
      .rotate(rotateOffset)

      // Спрайт факела
      .effect()
      .name(subtype)
      .file(lightImg)
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(0.5, { considerTokenScale: true })
      .scaleIn(0, 500, { ease: "easeOutElastic" })
      .scaleOut(0, 500, { ease: "easeOutCubic" })
      .spriteOffset(
        { x: torchOffsetX, y: 0.1 * token.document.width },
        { gridUnits: true }
      )
      .spriteScale(getSpriteScale(token))
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
      .loopProperty("sprite", "rotation", {
        from: 2,
        to: -2,
        duration: 1500,
        ease: "easeOutQuad",
        pingPong: true,
      })
      .persist()
      .rotate(rotateOffset)

      // Пламя
      .effect()
      .delay(250)
      .name(subtype)
      .file("jb2a.flames.01.orange")
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(1, { considerTokenScale: true })
      .spriteOffset(
        { x: torchOffsetX + 0.225, y: -0.1 * token.document.width },
        { gridUnits: true }
      )
      .spriteScale({
        x: 0.65 / token.document.texture.scaleX,
        y: 0.8 / token.document.texture.scaleY,
      })
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
      .loopProperty("sprite", "rotation", {
        from: 2,
        to: -2,
        duration: 1500,
        ease: "easeOutQuad",
        pingPong: true,
      })
      .persist()
      .spriteRotation(45)
      .zIndex(0.1)
      .rotate(rotateOffset)
      .waitUntilFinished()
      .play();
  } catch (error) {
    console.error("SLighting: Torch ignite animation failed:", error);
  }
}

/**
 * Анимация брошенного факела на item pile
 */
export async function playTorchPileFlame(tokenData, subtype) {
  try {
    await new Sequence()
      .effect()
      .delay(250)
      .name(`${subtype}_ip`)
      .file("jb2a.flames.01.orange")
      .atLocation(tokenData)
      .attachTo(tokenData, { bindRotation: true, local: true })
      .scaleToObject(1, { considerTokenScale: true })
      .spriteOffset(
        { x: 0, y: -0.225 * tokenData.document.width },
        { gridUnits: true }
      )
      .persist()
      .spriteRotation(45)
      .zIndex(0.1)
      .waitUntilFinished()
      .play();
  } catch (error) {
    console.error("SLighting: Torch pile animation failed:", error);
  }
}