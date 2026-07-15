# Arquitectura — Topografías de la intemperie

Visión de sistemas del software de composición: qué entra, qué hay dentro del visor y qué sale a pantalla y sonido.

Diagrama: **[arquitectura-dark.svg](./arquitectura-dark.svg)**.

### Audio

Howler con dos buses: entorno (HTML5, loop, no espacial) y objeto (Web Audio + HRTF anclado al GLB; la cámara es el oyente). Se sincroniza cada animation frame. Detalle: [audio-arquitectura-dark.svg](./audio-arquitectura-dark.svg).
