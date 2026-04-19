# Manual tests — Torch light source resolver

Probar en consola de Foundry (F12), con el módulo activo:

```js
const api = game.modules.get("antorchas")?.api ?? globalThis.AntorchasAPI;
```

## 1) Detección por `flags.antorchas.light` (prioridad #1)

```js
const item = {
  name: "Random Item",
  flags: { antorchas: { light: { dim: 40 } } },
  system: { type: { value: "tool", subtype: "none" } }
};
api.resolveLightSource(item);
```

Esperado:
- `isLightSource === true`
- `reason === "flags.antorchas.light"`

## 2) Detección por `system.type` lighting/torch (prioridad #2)

```js
const item = {
  name: "Converted Torch",
  flags: {},
  system: { type: { value: "lighting", subtype: "torch" } }
};
api.resolveLightSource(item);
```

Esperado:
- `isLightSource === true`
- `reason === "system.type.lighting.torch"`

## 3) Detección por `identifier === torch` (prioridad #3)

```js
const item = {
  name: "PHB Torch",
  system: { identifier: "torch", type: { value: "gear", subtype: "" } },
  flags: {}
};
api.resolveLightSource(item);
```

Esperado:
- `isLightSource === true`
- `reason === "system.identifier.torch"`

## 4) Fallback por nombre visible normalizado (prioridad #4)

```js
api.resolveLightSource({ name: "Antórcha", flags: {}, system: {} });
api.resolveLightSource({ name: "Torch", flags: {}, system: {} });
```

Esperado:
- ambos casos con `isLightSource === true`
- `reason === "name-fallback"`

## 5) Anti falso-positivo básico

```js
api.resolveLightSource({ name: "Torchbearer Emblem", flags: {}, system: {} });
```

Esperado:
- `isLightSource === false` (no debe detectar por subcadena)
