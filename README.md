# Antorchas (Foundry VTT module)

## ¿Qué hace este módulo?

**Antorchas** permite encender y apagar fuentes de luz consumibles sobre el token usando API nativa de Foundry (sin ATL obligatorio).

Incluye:
- detección robusta de antorchas (PHB, `lighting`, `identifier=torch`, fallback seguro por nombre),
- configuración de luz por ítem en `flags.antorchas.light`,
- estado activo por token en `flags.antorchas.activeLight`,
- compatibilidad opcional (opt-in) para enriquecer antorchas base del sistema (`identifier=torch`) sin migraciones destructivas.

---

## Versión objetivo

- **Foundry VTT**: v13 (minimum/verified 13).
- **Sistema**: `dnd5e`.

---

## Instalación local

1. Copia esta carpeta en:
   - `FoundryVTT/Data/modules/antorchas`
2. Verifica que `module.json` tenga:
   - `id: "antorchas"`
   - `esmodules: ["SLighting/slighting.js"]`
3. Inicia Foundry, activa el módulo en tu mundo y recarga.

---

## ¿Cómo detectar si la antorcha fue reconocida?

Puedes validarlo de varias formas:

1. **En hoja de ítem**: aparece el bloque “Configuración de luz” (y botón Encender/Apagar) solo para ítems reconocidos.
2. **En runtime**:
   - al encender, el token recibe `flags.antorchas.activeLight`.
3. **Por API** (consola):
   ```js
   game.modules.get("antorchas")?.api?.resolveLightSource(item)
   ```
   Devuelve `isLightSource: true` y una razón de detección.

---

## ¿Cómo configurar una luz personalizada?

En la hoja del ítem reconocido, dentro de “Configuración de luz”, ajusta:

- `bright`
- `dim`
- `angle`
- `color`
- `alpha`
- `luminosity`
- `attenuation`
- `contrast`
- `shadows`
- `animationType`, `animationSpeed`, `animationIntensity` (si Foundry lo soporta nativamente)

Estos valores se guardan en:
- `flags.antorchas.light`

---

## Limitaciones actuales (v1)

- No incluye animaciones avanzadas externas (Sequencer/JB2A) como requisito.
- El flujo está centrado en token seleccionado/activo y permisos de actualización del token.
- La compatibilidad de “enriquecimiento” de antorcha base es **opt-in** (setting de mundo) y conservadora.
- No se aplican migraciones masivas destructivas.

---

## Checklist de pruebas manuales

- [ ] 1) Antorcha básica del PHB en inglés
- [ ] 2) Antorcha básica del PHB en español
- [ ] 3) Antorcha `lighting`
- [ ] 4) Token seleccionado
- [ ] 5) Token no seleccionado
- [ ] 6) Apagar y volver a encender
- [ ] 7) Cambio de color y radios

Sugerencia: valida también que el flag `flags.antorchas.activeLight` aparezca/desaparezca al encender/apagar.
