# Topografías de la intemperie

Entorno virtual de memoria deformada.

### Script de Blender (`extrude_curves.py`)

Extruye curvas SVG importadas en Blender con un perfil de altura dinámico (coseno).

```python
# Ejecutar en Blender:
exec(open("/path/to/extrude_curves.py").read())
```

**Parámetros:**
- `MAX_HEIGHT` — altura máxima de extrusión
- `TOP_CURVE` / `BOTTOM_CURVE` — rango de curvas a procesar
- `COMPENSATE_CENTER` — centra verticalmente cada curva

### Visor (`index.html`)

Visor Three.js para modelos GLB exportados.

```bash
npm install
npm run start
```

#### Environment maps (EXR)

Los entornos deformados experimentales se construyen a partir de fotos en `env/exr/jpg/` (`.jpg`, `.jpeg`, `.heic`). La conversión usa [OpenImageIO](https://openimageio.readthedocs.io/) (`oiiotool`).

**Instalar OpenImageIO (macOS):**

```bash
brew install openimageio
```

**Convertir fuentes a EXR** (genera `env/exr/<name>_env.exr` y regenera la lista en `src/exrEnvironments.generated.js`):

```bash
npm run convert:env
```

Cada imagen se procesa con:

```bash
oiiotool <source> \
  --tocolorspace linear \
  --mulc 6,6,6 \
  --resize 4096x2048 \
  -o env/exr/<name>_env.exr
```

Tras la conversión, reinicia el visor y elige **env type → EXR** en Tweakpane para usar los nuevos mapas.

#### Estado de escena

En el visor, usa **State → Export JSON** / **Load JSON** (sobre las pestañas Scene/Animation) para guardar y restaurar la configuración (modelo, iluminación, entorno, cámara, animación del terreno, grain overlay, etc.). Las exportaciones se nombran `memory-{timestamp}.json`. Escenas predefinidas en `scenes/` (disensión, inefable, cuerda, ventanas, ciénaga).

**Atajos:** `Ctrl+I` (o `Cmd+I` en macOS) muestra u oculta el panel de controles.

**Grain overlay** usa [grained.js](https://github.com/sarathsaleem/grained) (MIT) — actívalo en la carpeta **Grain overlay** al final del panel de controles.

#### Sensor (IMU + NFC)

Controlador IMU y tarjetas NFC por WebSocket (`ws://127.0.0.1:8080`). El visor se conecta al arrancar; las tarjetas NFC (vía [ardeidae](../ardeidae)) envían `/nfc/card` y cargan escenas como las teclas 1–4. Configura el puerto serial y UIDs en `ardeidae/src/config.js`.

## Autor

Rafael Becerra

## Licencia

MIT
