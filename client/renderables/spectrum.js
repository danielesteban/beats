import {
  BufferAttribute,
  BoxBufferGeometry,
  BufferGeometryUtils,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
} from '../core/three.js';

// Spectrum visualizer

class Spectrum extends InstancedMesh {
  static setupGeometry() {
    const box = new BoxBufferGeometry(0.5, 0.5, 0.5, 3, 3, 3);
    box.deleteAttribute('normal');
    box.deleteAttribute('uv');
    const geometry = box.toNonIndexed();
    const { count } = geometry.getAttribute('position');
    const color = new BufferAttribute(new Float32Array(count * 3), 3);
    let light;
    for (let i = 0; i < count; i += 1) {
      if (i % 6 === 0) {
        light = 0.015 - Math.random() * 0.01;
      }
      color.setXYZ(i, light, light, light);
    }
    geometry.setAttribute('color', color);
    geometry.rotateY(Math.PI * 0.25);
    geometry.rotateX(Math.PI * -0.25);
    Spectrum.geometry = BufferGeometryUtils.mergeVertices(geometry);
  }

  static setupMaterial() {
    Spectrum.material = new MeshBasicMaterial({
      vertexColors: true,
    });
  }

  constructor() {
    if (!Spectrum.geometry) {
      Spectrum.setupGeometry();
    }
    if (!Spectrum.material) {
      Spectrum.setupMaterial();
    }
    super(
      Spectrum.geometry,
      Spectrum.material,
      Spectrum.count
    );
    this.instances = [];
    for (let i = 0; i < Spectrum.count; i += 1) {
      const instance = new Object3D();
      instance.band = i % 8;
      instance.scalar = 0.5 + Math.random() * 0.5;
      instance.position
        .set(
          Math.random() * 2 - 1,
          Math.random() * 1 - 0.25,
          Math.random() * 2 - 1
        )
        .normalize()
        .multiplyScalar(17 + Math.random() * 5);
      instance.updateMatrix();
      this.setMatrixAt(i, instance.matrix);
      this.instances.push(instance);
    }
  }

  update({ animation: { delta }, bands }) {
    const { instances } = this;
    instances.forEach((instance, i) => {
      const scale = 0.1 + ((bands[instance.band] / 200) * instance.scalar * 2);
      instance.scale.set(scale, scale, scale);
      instance.updateMatrix();
      this.setMatrixAt(i, instance.matrix);
    });
    this.instanceMatrix.needsUpdate = true;
    this.rotateY(delta * 0.05);
  }
}

Spectrum.count = 80;

export default Spectrum;
