# BRICE V23 — Prototipo conectado y operativo

Esta versión conserva la experiencia pública y el panel interno, pero conecta el panel con los datos reales de Supabase.

## URLs locales
- `/` — experiencia pública
- `/admin/` — panel interno

## Conexión
- `config.js` contiene la URL y publishable key de Supabase.
- El panel escucha Realtime en `experiences` y `bookings`.
- Las reservas creadas desde la experiencia pública aparecen en Reservas.
- Clientes y vehículos nuevos se derivan de las reservas reales.
- Cotizaciones/reservas reales se muestran en el panel.

## Importante
La clave usada es una clave publicable. No incluir claves secretas en el frontend.
