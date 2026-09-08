# BRICE V30 — flujo real de cotización → reserva

Esta versión corrige el problema de la experiencia en vivo y la confirmación.

## Fuente inmediata de verdad del prototipo

El prototipo usa `localStorage` como fuente inmediata y compartida entre la experiencia pública y `/admin/`. Esto evita que una espera de Supabase deje el panel en `Conectando…`.

La capa Supabase queda como espejo opcional y nunca bloquea la interfaz.

## Flujo esperado

1. Cliente completa la experiencia pública.
2. Al enviar la solicitud se crea una experiencia con estado `quoted` después del recorrido.
3. En `/admin/` aparece en **Cotizaciones** como **Pendiente por confirmar**.
4. Al abrirla aparecen **Confirmar y crear reserva** y **Cambiar horario**.
5. Confirmar crea simultáneamente:
   - experiencia `booked`
   - registro de reserva
   - actividad `Reserva creada`
6. La reserva aparece inmediatamente en:
   - **Reservas**
   - **Resumen → Próximas reservas**
   - **Actividad reciente**
   - **Notificaciones**
7. La comunicación entre pestañas usa `storage`, por lo que los cambios hechos en una pestaña se reflejan en la otra.

## Nota

Para evitar estados viejos de versiones anteriores, V30 usa una clave nueva de almacenamiento: `brice_demo_state_v3`.
