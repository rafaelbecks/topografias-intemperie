# Visor 3D

El visor (`src/main.js`) es la aplicación Three.js que **compone una escena de memoria** y permite explorarla. No solo muestra un modelo GLB: combina terreno, entorno, iluminación, agua, partículas, texto poético, audio espacial y postprocesado. El panel lateral (Tweakpane) es el editor de esa composición.

```bash
npm install
npm run start
```
---

## Cómo se arma la escena

Al arrancar, el visor carga un JSON de escena (`scenes/`, por defecto `front.json` o `?scene=…`) y reconstruye el estado:

| Capa | Qué aporta |
| --- | --- |
| **Terreno / modelo** | GLB (o escena solo-texto) + material (roughness, wireframe) |
| **Entorno** | HDR / EXR como mapa de entorno y fondo |
| **Iluminación** | Luz direccional + ambient + exposure (fallback o refuerzo del env map) |
| **Ocean** | Agua procedural (planos, discos con borde ruido, envolventes: esfera, torus, …) |
| **Partículas** | Nube muestreada del modelo |
| **Animación de terreno** | Deformación por capas del mesh (pestaña Animation) |
| **Texto** | Líneas del poema extruidas en 3D |
| **Audio** | Sonido ambiental + sonido ligado al objeto (espacial) |
| **Overlays** | Grain, dither SVG, ordered dither GPU |

**State → Export JSON / Load JSON** congela o restaura toda esa configuración (incluyendo cámara). Las exportaciones se nombran `memory-{timestamp}.json`. Escenas predefinidas en `scenes/`.

---

## Panel: State (arriba de las pestañas)

Controles globales de escena, fuera de las tabs:

- **Export JSON / Load JSON** — guardar o reabrir una memoria completa.
- **scene** — selector de escenas empaquetadas (`front`, ciénaga, cuerda, disensión, inefable, ventanas, …).
- **Reload scene** — vuelve a cargar la escena actual.
- **Browse scenes folder** — (si el navegador lo permite) abrir otra carpeta de JSON.

---

Sonido y voz.

**Spatial audio**

- Play / Stop.
- Sonido de entorno y de objeto, volúmenes, sensibilidad a la distancia.
- Fade al loopear.

**Voice (PoC)**

- Reconocimiento de voz (micrófono, idioma, subtítulos).
- Comandos hablados que disparan wireframe, partículas, dither, formas de océano, modelo Lionza, etc.

---

## Controles debajo de las pestañas

Siguen siendo parte del panel, compartidos entre tabs:

| Folder | Rol |
| --- | --- |
| **Grain overlay** | Grano fotográfico animado sobre el canvas |
| **Dither overlay** | Dither SVG (tablas R/G/B) y ciclo por voz |
| **Ordered dither (GPU)** | Postproceso de dither en GPU (se desactiva con stereo) |
| **Controller sensor** | IMU + distancia por WebSocket; calibración y zoom por proximidad |

---

## Navegación

Dos modos de cámara:

1. **Orbit (por defecto)** — arrastrar para orbitar, scroll para zoom, click derecho / dos dedos para pan (`OrbitControls`). Opcionalmente **auto rotate**.
2. **First person** — activar en **Scene → Camera → first person**:
   - `W` / `S` — adelante / atrás
   - `A` / `D` — izquierda / derecha
   - `Shift+W` / `Shift+S` — subir / bajar
   - Velocidad con **move speed**

El sensor IMU (si está activo) puede tomar el control de la pose del modelo u orbitar según el mapping en **Controller sensor**.

### Atajos de teclado

| Tecla | Acción |
| --- | --- |
| `0` | Escena front |
| `1`…`N` | Escenas del poema (ciénaga, cuerda, disensión, …) |
| `Space` | Toggle wireframe |
| `Shift+Space` | Toggle partículas |
| `Shift+X` | Activar / desactivar sensor |

(Los atajos se ignoran si estás escribiendo en un input.)

---