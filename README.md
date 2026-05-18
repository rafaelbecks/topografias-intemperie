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

## Author

Rafael Becerra

## License

MIT
