import {
  MODULE_ID,
  FLAG_NAMESPACE,
  CONSUMABLE_TYPE,
  SUBTYPES,
  DURATION_MULTIPLIERS,
  DEFAULT_LIGHT_CONFIG,
  ASSETS,
  BUTTON_STYLE,
} from "./constants.js";
import { playIgniteAnimation, playPileAnimation } from "./animations/index.js";

import { getLightConfig } from "./ui.js";

function createLightEffect({ item, subtype, duration, hooded = false }) {
  const config = getLightConfig(item);
  
  const rangeDim = hooded ? 5 : config.dim;
  const rangeBright = hooded ? 0 : config.bright;
  const angle = config.angle;

  const durationConfig = duration > 0 ? { seconds: duration } : {};

  const animationValue = JSON.stringify({
    type: config.animationType,
    speed: config.animationSpeed,
    intensity: config.animationIntensity,
  });

  return [
    {
      origin: item.uuid,
      duration: durationConfig,
      disabled: false,
      name: item.name,
      img: item.img,
      type: "base",
      changes: [
        { key: "ATL.light.dim", mode: 5, value: `${rangeDim}`, priority: 20 },
        { key: "ATL.light.bright", mode: 5, value: `${rangeBright}`, priority: 20 },
        { key: "ATL.light.alpha", mode: 5, value: `${config.alpha}`, priority: 20 },
        { key: "ATL.light.angle", mode: 5, value: `${angle}`, priority: 20 },
        { key: "ATL.light.luminosity", mode: 5, value: `${config.luminosity}`, priority: 20 },
        { key: "ATL.light.color", mode: 5, value: config.color, priority: 20 },
        { key: "ATL.light.animation", mode: 5, value: animationValue, priority: 20 },
        { key: "ATL.light.attenuation", mode: 5, value: `${config.attenuation}`, priority: 20 },
        { key: "ATL.light.contrast", mode: 5, value: `${config.contrast}`, priority: 20 },
        { key: "ATL.light.shadows", mode: 5, value: `${config.shadows}`, priority: 20 },
      ],
      transfer: false,
      flags: {
        [FLAG_NAMESPACE]: { source: subtype, hooded },
      },
    },
  ];
}

function calculateDuration(activity) {
  if (!game.settings.get(MODULE_ID, "LightTimer")) {
    return 0;
  }

  const units = activity.duration.units;
  const multiplier = DURATION_MULTIPLIERS[units] ?? 0;
  return (activity.duration.value || 0) * multiplier;
}

function getLightingContext(activity) {
  const subtype = activity.parent.type.subtype;
  const actor = activity.parent.parent.parent;
  const item = activity.parent.parent;
  const token = canvas.tokens.placeables.find((t) => t.actor?.id === actor.id);

  if (!token) {
    return null;
  }

  const range = activity.range.value || 20;
  const angle = subtype === SUBTYPES.BULLSEYE ? 60 : 360;
  const duration = calculateDuration(activity);

  const effects = actor.appliedEffects.find(
    (e) => e.flags[FLAG_NAMESPACE]?.source === subtype
  );
  const isHooded = actor.appliedEffects.find(
    (e) => e.flags[FLAG_NAMESPACE]?.hooded
  );

  return {
    subtype,
    actor,
    item,
    token,
    range,
    angle,
    duration,
    effects,
    isHooded,
  };
}

async function cleanupEffects(context) {
  const { effects, subtype, token } = context;

  if (effects) {
    await effects.delete();
  }

  Sequencer.EffectManager.endEffects({ name: subtype, object: token });
}

async function handleIgnite(context) {
  const { actor, item, token, subtype, range, angle, duration } = context;

  await cleanupEffects(context);

  const lightEffect = createLightEffect({
    item,
    subtype,
    duration,
    hooded: false,
  });

  await actor.createEmbeddedDocuments("ActiveEffect", lightEffect);
  await playIgniteAnimation(token, subtype);
}

async function handleDistinguish(context) {
  const { token } = context;

  await cleanupEffects(context);

  await new Promise((resolve) => setTimeout(resolve, 200));

  await token.document.update({
    "light.dim": 0,
    "light.bright": 0,
  });
}

async function handleThrow(context) {
  const { actor, item, token, subtype, effects, isHooded } = context;

  if (!game.modules.get("item-piles")?.active) {
    ui.notifications.warn("Item Piles module required for throwing");
    return;
  }

  const tileImg = ASSETS[subtype]?.tile ?? item.img;

  let range = 5;
  if (subtype === SUBTYPES.TORCH) {
    range = 20 + 5 * actor.system.abilities.str.mod;
    ui.notifications.info(
      game.i18n.format("SLighting.throw.range", { range })
    );
  }

  const crosshairConfig = {
    gridHighlight: true,
    icon: { texture: tileImg, borderVisible: false },
    location: {
      obj: token,
      limitMaxRange: range,
      showRange: true,
      wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.NO_COLLIDABLES,
    },
  };

  await actor.sheet.minimize();

  const position = await Sequencer.Crosshair.show(crosshairConfig);

  if (!position) {
    await actor.sheet.maximize();
    return;
  }

  let lightEffect;
  const effectDuration = effects?.duration.seconds ?? 0;

  if (isHooded) {
    lightEffect = createLightEffect({
      item,
      subtype,
      duration: effectDuration,
      hooded: true,
    });

    await token.document.update({
      "light.dim": 0,
      "light.bright": 0,
    });
  } else {
    lightEffect = createLightEffect({
      item,
      subtype,
      duration: effectDuration,
      hooded: false,
    });
  }

  const itemData = item.toObject();
  itemData.system.quantity = 1;
  itemData.img = tileImg;

  await item.update({ "system.quantity": item.system.quantity - 1 });

  await cleanupEffects(context);

  const rotation = subtype === SUBTYPES.TORCH ? 360 : 0;

  await new Sequence()
    .effect()
    .file(tileImg)
    .atLocation(token)
    .scale(0.5)
    .duration(1000)
    .anchor({ x: 0.5, y: 0.5 })
    .loopProperty("sprite", "rotation", {
      values: [0, rotation],
      duration: 1000,
      pingPong: false,
    })
    .moveTowards(position, { rotate: false })
    .zIndex(2)

    .effect()
    .file(tileImg)
    .atLocation(token)
    .opacity(0.5)
    .scale(0.5)
    .belowTokens()
    .duration(1000)
    .anchor({ x: 0.5, y: 0.5 })
    .filter("ColorMatrix", { brightness: -1 })
    .filter("Blur", { blurX: 5, blurY: 10 })
    .moveTowards(position, { rotate: false })
    .zIndex(2)
    .waitUntilFinished()
    .play();

  try {
    const options = {
      position: {
        x: position.x - canvas.scene.grid.size / 2,
        y: position.y - canvas.scene.grid.size / 2,
      },
      sceneId: game.scenes.current.id,
      tokenOverrides: {
        name: item.name,
        texture: { src: tileImg },
        rotation: 0,
        displayName: 0,
        sight: { enabled: false },
      },
      actorOverrides: {
        effects: lightEffect,
        ownership: { [game.user.id]: 3 },
        prototypeToken: {
          texture: { src: tileImg },
        },
      },
      items: [itemData],
      createActor: false,
      pileActorName: itemData.name,
      pileSettings: { 
        type: game.itempiles.pile_types.PILE,
        displayOne: false,
        overrideItemImage: tileImg,
      },
    };

    const { tokenUuid } = await game.itempiles.API.createItemPile(options);
    const tokenDocument = await fromUuid(tokenUuid);

    const pileToken = tokenDocument.object;
    playPileAnimation(pileToken, subtype);

  } catch (error) {
    console.error("SLighting: Failed to create item pile:", error);
    ui.notifications.error("Failed to throw light source");
  }

  actor.sheet.maximize();
}

async function handleHood(context) {
  const { actor, item, subtype, effects, isHooded, angle } = context;

  const effectDuration = effects?.duration.seconds ?? 0;

  const lightEffect = createLightEffect({
    item,
    subtype,
    duration: effectDuration,
    range: isHooded ? context.range : 0,
    angle,
    hooded: !isHooded,
  });

  if (effects) {
    await effects.delete();
  }

  await actor.createEmbeddedDocuments("ActiveEffect", lightEffect);
}

function buildDialogButtons(context) {
  const { effects, isHooded, subtype } = context;
  const buttons = [];

  if (effects) {
    buttons.push({
      action: "distinguish",
      label: game.i18n.localize("SLighting.distinguish"),
      icon: "fas fa-moon",
      style: BUTTON_STYLE,
    });
  } else {
    buttons.push({
      action: "ignite",
      label: game.i18n.localize("SLighting.ignite"),
      icon: "fas fa-sun",
      style: BUTTON_STYLE,
    });
  }

  // Кнопка бросить
  if (game.modules.get("item-piles")?.active) {
    buttons.push({
      action: "throw",
      label: game.i18n.localize(`SLighting.throw.${subtype}`) || "Throw",
      icon: "fas fa-bullseye",
      style: BUTTON_STYLE,
    });
  }

  // Кнопка капюшона (только для hooded лампы с активным эффектом)
  if (subtype === SUBTYPES.HOODED && effects) {
    buttons.push({
      action: "hood",
      label: game.i18n.localize(isHooded ? "SLighting.hood.off" : "SLighting.hood.on"),
      icon: "fas fa-bars",
      style: BUTTON_STYLE,
    });
  }

  return buttons;
}

export async function handleToggleLight(activity) {
  if (activity.parent?.type?.value !== CONSUMABLE_TYPE) return;
  if (activity.type !== "utility" || !activity.parent.type.subtype) return;
  if (!game.modules.get("ATL")?.active) {
    ui.notifications.warn("ATL module is required for lighting effects");
    return;
  }

  const context = getLightingContext(activity);

  if (!context) {
    ui.notifications.error("Token not found for this actor");
    return;
  }

  const { item, subtype } = context;

  if (item.system.quantity < 1) {
    ui.notifications.warn(game.i18n.localize("SLighting.OutOfStock"));
    return;
  }

  const buttons = buildDialogButtons(context);

  const handlers = {
    ignite: () => handleIgnite(context),
    distinguish: () => handleDistinguish(context),
    throw: () => handleThrow(context),
    hood: () => handleHood(context),
  };

  new foundry.applications.api.DialogV2({
    window: {
      title: `SLighting - ${game.i18n.localize(`SLighting.${subtype}.name`)}`,
      icon: "fas fa-lightbulb",
    },
    content: `
      <div style="
        display: flex;
        align-items: center;    
        justify-content: center;  
        text-align: center;
        padding: 0 0.5rem;
        border-radius: 4px;
        height: 80px;
        color: #e7d1b1;
        border: 1px solid #9f8475;
        font-family: 'Roboto Condensed', sans-serif;
        box-shadow: 0 2px 10px rgba(0,0,0,0.6);
      ">
        <p style="font-size: 1.2em; margin: 0;">
          ${game.i18n.localize(`SLighting.${subtype}.DoDialog`)}
        </p>
      </div>
    `,
    buttons,
    submit: (result) => {
      const handler = handlers[result];
      if (handler) {
        handler();
      }
    },
  }).render({ force: true });
}