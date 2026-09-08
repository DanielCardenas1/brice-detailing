# BRICE V25 — estado real y movimientos

Esta versión corrige el ciclo de experiencia → cotización → aceptación → reserva.

## Qué se corrigió
- La experiencia conserva el historial de cambios de estado dentro de `payload.activity`.
- `quoted` = cotización generada / pendiente de aceptación.
- `accepted` = cotización aceptada / pendiente de agenda.
- `booked` = reserva creada.
- El dashboard muestra los últimos movimientos reales, no una lista estática.
- Al navegar entre Resumen, Reservas, Clientes, Vehículos y Cotizaciones se vuelve a cargar el estado de Supabase para evitar pantallas desactualizadas.
- La reserva creada desde la experiencia se consulta desde `bookings` y aparece en Reservas.
- La cotización mantiene el detalle y permite abrirla; si ya está convertida, permite ir directamente a Reservas.
- `updateExperience` conserva el payload existente y agrega historial; ya no reemplaza accidentalmente datos anteriores.

## Flujo esperado
1. Cliente inicia recorrido → `in_progress`.
2. Cliente termina de construir el servicio → `quoted`.
3. La cotización llega al panel como **Pendiente por confirmar**.
4. El cliente indica horario preferido, datos de contacto y dirección; la cotización sigue pendiente y se registra el movimiento.
5. Brice abre la cotización y puede **Confirmar y crear reserva** con ese horario o **Cambiar horario** antes de confirmarla.
6. Solo al confirmar desde el panel se crea `booking` y la experiencia pasa a `booked`.
7. Dashboard: Actividad reciente conserva los movimientos reales del recorrido y la confirmación.
8. Notificaciones: muestran movimientos reales y cuántas cotizaciones están pendientes por confirmar.
9. Reservas: solo aparecen reservas reales creadas al confirmar una cotización.

## Supabase
No requiere una tabla nueva. El historial se guarda dentro del JSONB `payload.activity` de `experiences`.
