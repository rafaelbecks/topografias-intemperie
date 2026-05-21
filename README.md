# Cartografías Imposibles 3d

3D Extension of **Cartografías Imposibles**: maps of non-existent territories that follow their own spatial logic. Starting from suminagashi, its fluid logic is translated into an algorithmic process of continuous deformation.

## Components

### Blender Script (`extrude_curves.py`)

Extrudes imported SVG curves in Blender using a dynamic height profile (cosine).

```python path=null start=null
# Run in Blender:
exec(open("/path/to/extrude_curves.py").read())
```

**Settings:**
- `MAX_HEIGHT` — maximum extrusion height
- `TOP_CURVE` / `BOTTOM_CURVE` — range of curves to process
- `COMPENSATE_CENTER` — vertically centers each curve

### Viewer (`index.html`)

Three.js viewer for exported GLB models.

```bash path=null start=null
npm install
npm run start
```

#### Environment maps (EXR)

Experimental deformed environments are built from photos in `env/exr/jpg/` (`.jpg`, `.jpeg`, `.heic`). Conversion uses [OpenImageIO](https://openimageio.readthedocs.io/) (`oiiotool`).

**Install OpenImageIO (macOS):**

```bash path=null start=null
brew install openimageio
```

**Convert sources to EXR** (writes `env/exr/<name>_env.exr` and regenerates the env list in `src/exrEnvironments.generated.js`):

```bash path=null start=null
npm run convert:env
```

Each image is processed with:

```bash path=null start=null
oiiotool <source> \
  --tocolorspace linear \
  --mulc 6,6,6 \
  --resize 4096x2048 \
  -o env/exr/<name>_env.exr
```

After conversion, restart the viewer and pick **env type → EXR** in Tweakpane to use the new maps.

#### Scene state

In the viewer, use **State → Export JSON** / **Load JSON** (above the Scene/Animation tabs) to save and restore scene settings (model, lighting, environment, camera, terrain animation, grain overlay, etc.). Exports are named `memory-{timestamp}.json`.

**Shortcuts:** `Ctrl+I` (or `Cmd+I` on macOS) toggles the controls panel.

**Grain overlay** uses [grained.js](https://github.com/sarathsaleem/grained) (MIT) — enable it in the **Grain overlay** folder at the bottom of the controls panel.

## Author

Rafael Becerra

## License

MIT
