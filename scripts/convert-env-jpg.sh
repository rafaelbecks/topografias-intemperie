#!/usr/bin/env bash
# Convert env/exr/jpg sources (jpg, heic) to equirectangular EXR env maps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/env/exr/jpg"
OUT_DIR="$ROOT/env/exr"
MUL=6
RESIZE="4096x2048"

if ! command -v oiiotool >/dev/null 2>&1; then
  echo "oiiotool not found. Install OpenImageIO (e.g. brew install openimageio)." >&2
  exit 1
fi

shopt -s nullglob nocaseglob
files=("$SRC_DIR"/*.{jpg,jpeg,heic,png})
shopt -u nocaseglob

if [ ${#files[@]} -eq 0 ]; then
  echo "No jpg/heic/png files in $SRC_DIR" >&2
  exit 1
fi

for src in "${files[@]}"; do
  base="$(basename "$src")"
  stem="${base%.*}"
  out="$OUT_DIR/${stem}_env.exr"
  echo "→ $out"
  oiiotool "$src" \
    --tocolorspace linear \
    --mulc "$MUL,$MUL,$MUL" \
    --resize "$RESIZE" \
    -o "$out"
done

node "$ROOT/scripts/generate-exr-config.mjs"
echo "Done. ${#files[@]} file(s) converted."
