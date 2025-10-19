# Simulador de Circuitos (Proyecto Final de Física)

Pequeña app web para dibujar, simular y visualizar circuitos eléctricos básicos desde el navegador.

## Funcionalidades
- Dibujo y edición de componentes (resistencias, fuentes, conexiones).
- Cálculos en tiempo real de parámetros del circuito.
- Renderizado del circuito en lienzo.
- Modo claro/oscuro.
- UI simple y responsive.

## Estructura
- `index.html`: página principal.
- `static/css/styles.css`: estilos globales.
- `static/js/app.js`: lógica de la app y orquestación.
- `static/js/circuit-calculator.js`: funciones de cálculo eléctrico.
- `static/js/circuitRenderer.js`: renderizado del circuito.
- `static/js/theme-controller.js`: cambio de tema.

## Requisitos
- Navegador moderno (Chrome, Edge, Firefox, Safari).
- No requiere backend ni instalación de dependencias.

## Cómo usar
- Opción 1: haz doble clic en `index.html` para abrirlo en el navegador.
- Opción 2 (recomendada): sirve la carpeta con un servidor estático para evitar restricciones CORS.
  - En VS Code puedes usar la extensión “Live Server”.

## Personalización
- Ajusta estilos en `static/css/styles.css`.
- Agrega nuevos componentes o reglas en `static/js/circuit-calculator.js` y `static/js/circuitRenderer.js`.

## Estado
- Versión inicial; en desarrollo activo.

## Licencia
- Por definir.
