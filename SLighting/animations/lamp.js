import { ASSETS } from "../constants.js";

/**
 * Получение offset для автоповорота
 */
function getAutoRotateOffset(token) {
  return token.document.flags?.autorotate?.offset ?? 0;
}

/**
 * Анимация поджига лампы (lamp, bullseye, hooded)
 */
export async function playLampIgnite(token, subtype) {
  const lightImg = ASSETS.lamp.item;
  const rotateOffset = getAutoRotateOffset(token);

  try {
    await new Sequence()
      .effect()
      .name(subtype)
      .file(lightImg)
      .atLocation(token)
      .attachTo(token, { bindRotation: true, local: true })
      .scaleToObject(1, { considerTokenScale: true })
      .scaleIn(0, 500, { ease: "easeOutElastic" })
      .scaleOut(0, 250, { ease: "easeOutCubic" })
      .spriteOffset(
        { x: 0.35 * token.document.width, y: 0.1 * token.document.width },
        { gridUnits: true }
      )
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
        from: 3,
        to: -3,
        duration: 1500,
        ease: "easeOutQuad",
        pingPong: true,
      })
      .persist()
      .rotate(rotateOffset)
      .spriteScale({
        x: 0.5 / token.document.texture.scaleX,
        y: 0.5 / token.document.texture.scaleY,
      })
      .waitUntilFinished()
      .play();
  } catch (error) {
    console.error("SLighting: Lamp ignite animation failed:", error);
  }
}