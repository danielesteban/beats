import {
  CircleBufferGeometry,
  Mesh,
  MeshBasicMaterial,
} from '../core/three.js';

// Fake shadow plane

class Shadow extends Mesh {
  static setupGeometry() {
    const geometry = new CircleBufferGeometry(0.5, 32);
    geometry.rotateX(Math.PI * -0.5);
    geometry.deleteAttribute('normal');
    geometry.deleteAttribute('uv');
    Shadow.geometry = geometry;
  }

  static setupMaterial() {
    Shadow.material = new MeshBasicMaterial({
      color: 0,
      transparent: true,
      opacity: 0.15,
    });
  }

  constructor({ width, length }) {
    if (!Shadow.geometry) {
      Shadow.setupGeometry();
    }
    if (!Shadow.material) {
      Shadow.setupMaterial();
    }
    super(
      Shadow.geometry,
      Shadow.material
    );
    this.scale.set(width, 1, length);
    this.position.y = 0.001;
  }
}

export default Shadow;
