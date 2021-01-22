import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometryUtils,
  Mesh,
  MeshBasicMaterial,
} from '../core/three.js';

// Display Stand

class Stand extends Mesh {
  static setupGeometry() {
    const box = new BoxBufferGeometry(0.25, 1, 0.25, 4, 6, 4);
    box.deleteAttribute('normal');
    box.deleteAttribute('uv');
    const geometry = box.toNonIndexed();
    const position = geometry.getAttribute('position');
    const { count } = position;
    const color = new BufferAttribute(new Float32Array(count * 3), 3);
    let light;
    for (let i = 0; i < count; i += 1) {
      if (i % 6 === 0) {
        light = 0.015 - Math.random() * 0.01;
      }
      color.setXYZ(i, light, light, light);
      const y = position.getY(i);
      if (y === 0.5) {
        position.setY(i, y + (0.125 - position.getZ(i)));
      }
    }
    geometry.setAttribute('color', color);
    geometry.translate(0, 0.5, 0);
    Stand.geometry = BufferGeometryUtils.mergeVertices(geometry);
  }

  static setupMaterial() {
    Stand.material = new MeshBasicMaterial({
      vertexColors: true,
    });
  }

  constructor() {
    if (!Stand.geometry) {
      Stand.setupGeometry();
    }
    if (!Stand.material) {
      Stand.setupMaterial();
    }
    super(
      Stand.geometry,
      Stand.material
    );
  }
}

export default Stand;
