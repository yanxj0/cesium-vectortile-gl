import { VectorTileset } from "../Source/VectorTileset";
// import { VectorTileset } from "../dist/cvt-gl.js"
class VectorLayer {
  constructor(options) {
    this.options = options;
    if (options?.bbox) {
      this.setBBox(options.bbox);
    }
    this.tileset = new VectorTileset(this.options);
  }

  setBBox(bbox, viewer) {
    let changed = false;
    const sources = this.options.style.sources;
    Object.entries(sources).forEach(([k, it]) => {
      const url = new URL(it.tiles[0]);
      const sp = url.searchParams;
      const bb = sp.get("bbox");
      if (bb !== bbox) {
        sp.set("bbox", bbox);
        it.tiles[0] = decodeURIComponent(url.toString());
        !changed && (changed = true);
      }
    });
    if (changed && this.tileset) {
      viewer.scene.primitives.remove(this.tileset);
      this.tileset = null;
      requestAnimationFrame(() => {
        this.tileset = new VectorTileset(this.options);
        viewer.scene.primitives.add(this.tileset);
      });
    }
  }
}

const viewer = new Cesium.Viewer(document.body, {
  creditContainer: document.createElement("div"),
  scene3DOnly: true,
  contextOptions: {
    requestWebgl1: true,
  },
  infoBox: true,
});
viewer.resolutionScale = devicePixelRatio;
viewer.scene.globe.depthTestAgainstTerrain = false;
viewer.scene.debugShowFramesPerSecond = true;
viewer.postProcessStages.fxaa.enabled = true;

//在添加矢量瓦片集之前添加贴地entity，
//验证贴地Entity的添加顺序是否影响贴合矢量瓦片的效果
viewer.entities.add({
  polyline: {
    clampToGround: true,
    positions: Cesium.Cartesian3.fromDegreesArray([
      -80.519, 40.6388, -124.1595, 46.2611,
    ]),
    width: 2,
  },
});

//矢量瓦片集添加到Cesium场景

const tileset = new VectorLayer({
  // style: '/assets/demotiles/style.json'
  style: {
    sources: {
      china: {
        type: "vector",
        tiles: [
          //   "http://192.168.1.69:20000/api/mvt/spectrum.tbl_ass_rsbt_station_geog_fb/{z}/{x}/{y}?bbox=113.4834,34.4097,114.0932,34.8134",
          "http://localhost:3000/api/mvt/public.china/{z}/{x}/{y}",
        ],
      },
      stations: {
        type: "vector",
        tiles: [
          //   "http://192.168.1.69:20000/api/mvt/spectrum.tbl_ass_rsbt_station_geog_fb/{z}/{x}/{y}?bbox=113.4834,34.4097,114.0932,34.8134",
          "http://localhost:3000/api/mvt/public.stations/{z}/{x}/{y}",
        ],
      },
    },
    layers: [
      {
        id: "us_states:fill",
        "source-layer": "public.china",
        type: "fill",
        source: "china",
        paint: {
          "fill-color": "#0468fd",
          "fill-opacity": 0.5,
        },
      },
      {
        id: "countries-boundary",
        type: "line",
        paint: {
          "line-color": "rgba(255, 255, 255, 1)",
          "line-width": {
            stops: [
              [1, 1],
              [6, 2],
              [14, 6],
              [22, 12],
            ],
          },
          "line-opacity": {
            stops: [
              [3, 0.5],
              [6, 1],
            ],
          },
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
        source: "china",
        maxzoom: 24,
        "source-layer": "public.china",
      },
      {
        id: "stations",
        type: "circle",
        source: "stations",
        "source-layer": "public.stations",
        paint: {
          "circle-radius": [
            "interpolate",
            ["exponential", 1.75],
            ["zoom"],
            6,
            2,
            18,
            6,
          ],
          "circle-color": "#ff0000",
        },
      },
    ],
  },
});
viewer.scene.primitives.add(tileset.tileset);

setTimeout(() => {
  const btn = document.createElement("button");
  btn.innerHTML = "点我";
  btn.style.position = "fixed";
  btn.style.top = "10px";
  btn.style.left = "10px";
  btn.onclick = () => {
    tileset.setBBox("112.7765,34.1014,114.6005,34.9400", viewer);
    // (tileset._cacheTiles || []).forEach((expiredTile) => {
    //   expiredTile.unload();
    //   //   expiredTile.expired = true;
    // });
    // tileset.sources.stations.styleSource.tiles[0] = `${tileset.sources.stations.styleSource.tiles[0]}?bbox=112.7765,34.1014,114.6005,34.9400`;
  };
  document.body.append(btn);
});

//在添加矢量瓦片集之后添加贴地entity，
//验证贴地Entity的添加顺序是否影响贴合矢量瓦片的效果
viewer.entities.add({
  position: Cesium.Cartesian3.fromDegrees(-80.519, 40.6388),
  polyline: {
    clampToGround: true,
    positions: Cesium.Cartesian3.fromDegreesArray([
      -70.519, 40.6388, -144.1595, 46.2611,
    ]),
    material: Cesium.Color.DARKORANGE,
    width: 3,
  },
  box: {
    dimensions: new Cesium.Cartesian3(500000, 500000, 500000),
  },
});

window.tileset = tileset;
window.viewer = viewer;
