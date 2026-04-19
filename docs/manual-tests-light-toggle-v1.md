# Manual tests — V1 toggle de luz nativo (sin ATL)

## Hooks cubiertos

- `dnd5e.postUseActivity` (compatibilidad con activities).
- `dnd5e.useItem` (camino básico para ítems PHB sin activity especial).

## Preparación

1. Tener un actor con token en escena.
2. Seleccionar el token (o usar actor con token activo).
3. Tener al menos dos ítems tipo antorcha (por ejemplo una PHB y otra convertida a `lighting`).

## Caso 1 — Encender desde PHB básico

Acción:
- Usar un ítem con `system.identifier = "torch"`.

Esperado:
- El token enciende luz.
- Se guarda `flags.antorchas.activeLight` en el token.

## Caso 2 — Reusar la misma fuente (toggle off)

Acción:
- Volver a usar el mismo ítem.

Esperado:
- La luz del token se apaga (`dim/bright = 0`).
- Se elimina `flags.antorchas.activeLight`.

## Caso 3 — Reemplazo por otra fuente

Acción:
- Encender con una antorcha A y luego usar antorcha B.

Esperado:
- La luz previa del módulo se reemplaza por la configuración de B.
- `flags.antorchas.activeLight.sourceKey` cambia a B.

## Caso 4 — Config por flags del ítem

Acción:
- Definir `flags.antorchas.light` en un ítem (por ejemplo `bright`, `dim`, `color`) y usarlo.

Esperado:
- El token aplica esa configuración.

## Caso 5 — Errores manejados

1. Sin token seleccionado/activo:
   - Esperado: notificación de token no disponible.
2. Actor no encontrado:
   - Esperado: notificación de actor no encontrado.
3. Item no reconocido:
   - Esperado: notificación de item no reconocido como fuente de luz.
4. Sin permisos sobre token:
   - Esperado: notificación de permisos insuficientes.
