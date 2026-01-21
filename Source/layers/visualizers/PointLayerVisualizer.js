import { VectorTileFeature } from "@mapbox/vector-tile";
import { ILayerVisualizer } from "./ILayerVisualizer.js"; // 调整路径
import { loadGeometry } from "maplibre-gl/src/data/load_geometry"; // 注意：使用默认导入，如果是 ESM

class PointLayerVisualizer extends ILayerVisualizer {
  constructor(layers, tile) {
    super(layers, tile);
    this.pointCollection = null;
    this.state = "none";
    this.addedToScene = false; // ← 新增
  }

  addLayer(features, layer, frameState, tileset) {
    const style = layer.style;
    const promoteId = tileset.sources[style.source]?.styleSource?.promoteId;

    // 如果还没有创建 collection，就创建（建议一个 tile 一个 collection）
    if (!this.pointCollection) {
      this.pointCollection = new Cesium.PointPrimitiveCollection({
        show: true,
        blendOption: Cesium.BlendOption.TRANSLUCENT,
      });
    }

    let batchId = 0;
    layer.firstBatchId = batchId;
    for (const feature of features) {
      const featureType = VectorTileFeature.types[feature.type];
      if (!["Point", "MultiPoint"].includes(featureType)) continue;

      const radius =
        style.paint.getDataValue("circle-radius", this.tile.z, feature) ?? 5;
      const colorStr =
        style.paint.getDataValue("circle-color", this.tile.z, feature) ??
        "#000000";
      const opacity =
        style.paint.getDataValue("circle-opacity", this.tile.z, feature) ?? 1.0;

      let baseColor = style.convertColor(colorStr) ?? Cesium.Color.BLACK;
      const color = baseColor.withAlpha(opacity);

      const vtCoords = loadGeometry(feature).flat(); // 处理 MultiPoint

      vtCoords.forEach((pt) => {
        const worldPt = this.tile.transformPoint(pt.x, pt.y, [0, 0]);
        const position = Cesium.Cartesian3.fromDegrees(
          worldPt[0],
          worldPt[1],
          0,
        );

        this.pointCollection.add({
          position,
          color,
          pixelSize: radius * 2, // pixelSize 是直径
          // 可选：如果想稍微柔化边缘
          // outlineColor: Cesium.Color.BLACK.withAlpha(0.3),
          // outlineWidth: 1.0,
          id: batchId, // 用于 picking（可选）
          show: true,
          scaleByDistance: new Cesium.NearFarScalar(
            1000.0, // 近处（1000米内）保持正常大小
            2.0, // 倍率，可调大一点让近处更明显
            900000.0, // 远处（500km）缩小到原大小的 0.1
            0.01, // 远处缩小到 10%
          ),
        });
      });

      batchId++;
    }

    // 只加一次到场景
    if (!this.addedToScene && this.pointCollection.length > 0) {
      const scene = viewer?.scene;
      if (scene && !this.pointCollection.isDestroyed()) {
        scene.primitives.add(this.pointCollection);
        this.addedToScene = true;
      }
    }
    layer.lastBatchId = batchId - 1;
    this.layers.push(layer);
  }

  update(frameState, tileset) {
    if (this.state !== "none") return;

    // 这里不再添加 collection，只更新显示状态（如果需要）
    if (this.pointCollection && !this.pointCollection.isDestroyed()) {
      this.pointCollection.show = true; // 或根据可见性控制
    }

    this.state = "done";
  }

  destroy() {
    if (this.pointCollection && !this.pointCollection.isDestroyed()) {
      const scene = viewer?.scene;
      if (this.addedToScene && scene) {
        scene.primitives.remove(this.pointCollection);
      }
    }
    this.pointCollection = null;
    this.addedToScene = false;
    super.destroy();
  }
}

export { PointLayerVisualizer };
