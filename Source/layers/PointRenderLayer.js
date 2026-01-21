import { IRenderLayer } from "./IRenderLayer.js"; // 调整路径为相对仓库
import { registerRenderLayer } from "./registerRenderLayer.js"; // 调整路径
import { PointLayerVisualizer } from "./visualizers/PointLayerVisualizer.js";

class PointRenderLayer extends IRenderLayer {
  constructor(sourceFeatures, styleLayer, tile) {
    super(sourceFeatures, styleLayer, tile);

    // 初始化特定属性（如果 point 支持 dash 等扩展，可加）
    this.firstBatchId = -1;
    this.lastBatchId = -1;
    this.offsets = [];
    this.counts = [];
    this.commandList = [];
  }

  /**
   * @param {Cesium.FrameState} frameState
   * @param {VectorTileset} tileset
   */
  update(frameState, tileset) {
    // 可在这里动态更新样式（如同步颜色），但 point 简单，通常委托 visualizer
    super.update(frameState, tileset);
  }

  destroy() {
    super.destroy();
  }
}

registerRenderLayer("circle", PointRenderLayer, PointLayerVisualizer);

export { PointRenderLayer };