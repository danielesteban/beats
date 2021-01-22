import {
  BufferAttribute,
  BufferGeometryUtils,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneBufferGeometry,
} from '../core/three.js';

// Wall plane

class Wall extends Mesh {
  static setupMaterial() {
    Wall.material = new MeshBasicMaterial({
      side: DoubleSide,
      vertexColors: true,
    });
  }

  constructor({ width, height, light = 1 }) {
    if (!Wall.material) {
      Wall.setupMaterial();
    }
    const plane = new PlaneBufferGeometry(width, height, width * 4, height * 4);
    plane.deleteAttribute('normal');
    plane.deleteAttribute('uv');
    const geometry = plane.toNonIndexed();
    const { count } = geometry.getAttribute('position');
    const color = new BufferAttribute(new Float32Array(count * 3), 3);
    const xStride = 6;
    const yStride = width * 4 * 6;
    for (let y = 0; y < height; y += 1) {
      const ty = y * 4;
      for (let x = 0; x < width; x += 1) {
        const tx = x * 4;
        const tl = (0.06 - (Math.random() * 0.02)) * light;
        for (let j = 0; j < 16; j += 1) {
          const fy = ty + Math.floor(j / 4);
          const fx = tx + (j % 4);
          let l = tl - (Math.random() * 0.01);
          if (
            fx <= 0
            || fx >= (width * 4) - 1
            || fy <= 0
            || fy >= (height * 4) - 1
          ) {
            l = (0.01 - (Math.random() * 0.004)) * light;
          }
          const i = (fy * yStride) + (fx * xStride);
          for (let k = 0; k < 6; k += 1) {
            color.setXYZ(i + k, l, l, l);
          }
        }
      }
    }
    geometry.setAttribute('color', color);
    super(
      BufferGeometryUtils.mergeVertices(geometry),
      Wall.material
    );
  }

  dispose() {
    const { geometry } = this;
    geometry.dispose();
  }
}

export default Wall;
