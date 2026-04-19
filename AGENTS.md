export async function getAllEquipment() {
  const result = {
    weapon: {},
    equipment: {},
    consumable: {},
  };

  const loadEntries = async (configObj, target) => {
    const entries = Object.entries(configObj);
    const docs = await Promise.all(
      entries.map(([key, uuid]) => fromUuid(uuid).then(doc => [key, doc]).catch(() => [key, null]))
    );
    for (const [key, doc] of docs) {
      if (doc) target[key] = doc;
    }
  };

  await Promise.all([
    loadEntries(CONFIG.DND5E.weaponIds, result.weapon),
    loadEntries(CONFIG.DND5E.armorIds, result.equipment),
    loadEntries(CONFIG.DND5E.shieldIds, result.equipment),
    loadEntries(CONFIG.DND5E.ammoIds, result.consumable),
  ]);

  const extras = await Promise.all([
    fromUuid("Compendium.dnd5e.equipment24.Item.dmgsupRingofResi").catch(() => null),
    fromUuid("Compendium.fifthpendium.items.Item.9cGRIHJNFKAeYJbE").catch(() => null),
    fromUuid("Compendium.fifthpendium.items.Item.Q3oXWnPr3SWdzFRH").catch(() => null),
  ]);

  if (extras[0]) result.equipment["ring"] = extras[0];
  if (extras[1]) result.equipment["wand"] = extras[1];
  if (extras[2]) result.equipment["rod"] = extras[2];

  return result;
}

export async function weaponMasterySwitch(activity, weaponIds) {
  if (activity.id != "weaponMastery000") return;
  weaponIds = weaponIds.weapon;
  let actor = activity.parent.parent.parent;
  const mastery = actor.system.traits.weaponProf.mastery.value ?? new Set();

  let weaponProficiency = [];
  for (let key of Object.keys(actor.system.traits.weaponProf.value)) {
    if (!mastery.has(key)) {
      weaponProficiency.push(key);
    }
  }

  for (let key of Object.keys(weaponIds)) {
    if (
      actor.system.traits.weaponProf.value.has(key) ||
      (actor.system.traits.weaponProf.value.has("sim") &&
        (weaponIds[key].system.type.value == "simpleM" ||
          weaponIds[key].system.type.value == "simpleR")) ||
      (actor.system.traits.weaponProf.value.has("mar") &&
        (weaponIds[key].system.type.value == "martialM" ||
          weaponIds[key].system.type.value == "martialR"))
    ) {
      weaponProficiency.push(key);
    }
  }

  const leftOptions = Array.from(mastery)
    .map((key) => `<option value="${key}">${weaponIds[key].name}</option>`)
    .join("");
  const rightOptions = weaponProficiency
    .map((key) => `<option value="${key}">${weaponIds[key].name}</option>`)
    .join("");

  const content = `
    <fieldset class="fifthpendium-slim-fieldset">
    <div style="display:flex; align-items:center; gap:12px; padding:6px; width:100%;">
    <select name="oldMastery">
      ${leftOptions}
    </select>
    <i class="fa-solid fa-arrow-right" style="color:#e7d1b1;"></i>
    <select name="newMastery">
      ${rightOptions}
    </select>
    </div>
    </fieldset>
  `;

  await new foundry.applications.api.DialogV2({
    window: {
      title: game.i18n.localize("FIFTHPENDIUM.WeaponMastery.Title"),
      icon: "fa fa-award"
    },
    content,
    buttons: [
      {
        action: "save",
        label: game.i18n.localize("FIFTHPENDIUM.WeaponMastery.Swap"),
        callback: (event, button, dialog) => {
          let masteries = actor.system.traits.weaponProf.mastery.value;
          masteries.delete(button.form.elements.oldMastery.value);
          masteries.add(button.form.elements.newMastery.value);
          actor.update({ "system.traits.weaponProf.mastery.value": masteries });
        },
      },
    ],
    submit: async (result) => {},
  }).render(true);
}
