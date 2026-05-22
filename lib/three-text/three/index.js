import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import { Text as Text$1 } from '../index.js';
import { MeshGeometryBuilder } from '../index.js';

function buildThreeResult(layoutHandle, meshPipeline, options) {
    const meshResult = meshPipeline.build(layoutHandle, options);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(meshResult.vertices, 3));
    geometry.setAttribute('normal', new Float32BufferAttribute(meshResult.normals, 3));
    geometry.setIndex(new Uint32BufferAttribute(meshResult.indices, 1));
    if (meshResult.colors) {
        geometry.setAttribute('color', new Float32BufferAttribute(meshResult.colors, 3));
    }
    if (meshResult.glyphAttributes) {
        geometry.setAttribute('glyphCenter', new Float32BufferAttribute(meshResult.glyphAttributes.glyphCenter, 3));
        geometry.setAttribute('glyphIndex', new Float32BufferAttribute(meshResult.glyphAttributes.glyphIndex, 1));
        geometry.setAttribute('glyphLineIndex', new Float32BufferAttribute(meshResult.glyphAttributes.glyphLineIndex, 1));
        geometry.setAttribute('glyphProgress', new Float32BufferAttribute(meshResult.glyphAttributes.glyphProgress, 1));
        geometry.setAttribute('glyphBaselineY', new Float32BufferAttribute(meshResult.glyphAttributes.glyphBaselineY, 1));
    }
    geometry.computeBoundingBox();
    const update = async (newOptions) => {
        const mergedOptions = { ...options };
        for (const key in newOptions) {
            const value = newOptions[key];
            if (value !== undefined) {
                mergedOptions[key] = value;
            }
        }
        if (newOptions.font !== undefined ||
            newOptions.fontVariations !== undefined ||
            newOptions.fontFeatures !== undefined) {
            const newLayout = await layoutHandle.update(mergedOptions);
            meshPipeline.setFont(newLayout.loadedFont, newLayout.fontId);
            meshPipeline.reset();
            layoutHandle = newLayout;
            options = mergedOptions;
            return buildThreeResult(layoutHandle, meshPipeline, options);
        }
        const newLayout = await layoutHandle.update(mergedOptions);
        layoutHandle = newLayout;
        options = mergedOptions;
        return buildThreeResult(layoutHandle, meshPipeline, options);
    };
    return {
        geometry,
        glyphs: meshResult.glyphs,
        planeBounds: meshResult.planeBounds,
        stats: meshResult.stats,
        query: meshResult.query,
        coloredRanges: meshResult.coloredRanges,
        getLoadedFont: () => layoutHandle.getLoadedFont(),
        getCacheSize: () => meshPipeline.getCacheSize(),
        clearCache: () => meshPipeline.clearCache(),
        measureTextWidth: (text, letterSpacing) => layoutHandle.measureTextWidth(text, letterSpacing),
        update,
        dispose: () => layoutHandle.dispose()
    };
}
class Text {
    static { this.setHarfBuzzPath = Text$1.setHarfBuzzPath; }
    static { this.setHarfBuzzBuffer = Text$1.setHarfBuzzBuffer; }
    static { this.init = Text$1.init; }
    static { this.registerPattern = Text$1.registerPattern; }
    static { this.preloadPatterns = Text$1.preloadPatterns; }
    static { this.setMaxFontCacheMemoryMB = Text$1.setMaxFontCacheMemoryMB; }
    static { this.enableWoff2 = Text$1.enableWoff2; }
    static async create(options) {
        const layoutHandle = await Text$1.create(options);
        const meshPipeline = new MeshGeometryBuilder(layoutHandle.loadedFont, layoutHandle.fontId);
        return buildThreeResult(layoutHandle, meshPipeline, options);
    }
}

export { Text };
