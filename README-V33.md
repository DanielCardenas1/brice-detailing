# BRICE V33

Correcciones sobre V32:

- Cotización en vivo: corregido el HTML del detalle para que Incluido/No seleccionó no rompan la cuadrícula del modal.
- Vehículos: corregida la tabla para que los vehículos provenientes de la experiencia no inserten el modal dentro de la fila.
- Vehículos: los vehículos en vivo se consolidan y pueden abrirse correctamente.
- Reservas: la vista vuelve a leer el estado local al renderizar y también acepta una experiencia `booked` como fuente de la reserva, evitando que la pestaña quede congelada en las 4 reservas demo.
- Cotizaciones: la vista vuelve a consultar el estado local al entrar.
- Confirmación: después de confirmar se verifica que exista la reserva o la experiencia `booked`, se recarga el estado y se navega a Reservas.
- Experiencia en vivo: conserva altura fija y desplazamiento interno de V32.

Prueba recomendada:
1. Abrir una cotización con estado `Pendiente por confirmar`.
2. Confirmar y crear reserva.
3. Aceptar el mensaje de confirmación.
4. Entrar a Reservas: debe aparecer el cliente nuevo.
5. Entrar a Vehículos: debe aparecer su vehículo una sola vez y el botón Ver debe abrir el modal correctamente.
6. Volver a Resumen: Experiencia en vivo debe permanecer en un panel de altura fija con scroll interno.
