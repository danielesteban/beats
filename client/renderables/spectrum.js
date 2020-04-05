import {
  BoxGeometry,
  BufferGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  VertexColors,
} from '../core/three.js';

// Spectrum visualizer

class Spectrum extends InstancedMesh {
  static setupGeometry() {
    const box = new BoxGeometry(0.5, 0.5, 0.5, 3, 3, 3);
    box.faces.forEach((face, i) => {
      if (i % 2 === 1) {
        face.color.setHSL(0, 0, 0.015 - Math.random() * 0.01);
        box.faces[i - 1].color.copy(face.color);
      }
    });
    box.rotateY(Math.PI * 0.25);
    box.rotateX(Math.PI * -0.25);
    const geometry = (new BufferGeometry()).fromGeometry(box);
    delete geometry.attributes.normal;
    delete geometry.attributes.uv;
    Spectrum.geometry = geometry;
  }

  static setupMaterial() {
    Spectrum.material = new MeshBasicMaterial({
      vertexColors: VertexColors,
    });
  }

  constructor() {
    if (!Spectrum.geometry) {
      Spectrum.setupGeometry();
    }
    if (!Spectrum.material) {
      Spectrum.setupMaterial();
    }
    const count = 100;
    super(
      Spectrum.geometry,
      Spectrum.material,
      count
    );
    this.instances = [];
    let band = 0;
    for (let i = 0; i < count; i += 1) {
      const instance = new Object3D();
      instance.band = band;
      instance.scalar = 0.5 + Math.random() * 0.5;
      band = (band + 1) % 8;
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

export default Spectrum;
