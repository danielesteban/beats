import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometryUtils,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from '../core/three.js';

// Synth particles

class Synth extends InstancedMesh {
  static setupGeometry() {
    const box = new BoxBufferGeometry(0.02, 0.02, 0.02, 2, 2, 2);
    box.deleteAttribute('normal');
    box.deleteAttribute('uv');
    const geometry = box.toNonIndexed();
    const { count } = geometry.getAttribute('position');
    const color = new BufferAttribute(new Float32Array(count * 3), 3);
    let light;
    for (let i = 0; i < count; i += 1) {
      if (i % 6 === 0) {
        light = 0.8 - Math.random() * 0.2;
      }
      color.setXYZ(i, light, light, light);
    }
    geometry.setAttribute('color', color);
    geometry.rotateY(Math.PI * 0.25);
    geometry.rotateX(Math.PI * -0.25);
    Synth.geometry = BufferGeometryUtils.mergeVertices(geometry);
  }

  static setupMaterial() {
    Synth.material = new MeshBasicMaterial({
      color: (new Color(0xffe0bd)).convertSRGBToLinear(),
      vertexColors: true,
    });
  }

  constructor() {
    if (!Synth.geometry) {
      Synth.setupGeometry();
    }
    if (!Synth.material) {
      Synth.setupMaterial();
    }
    super(
      Synth.geometry,
      Synth.material,
      Synth.particles
    );
    this.auxInstance = new Object3D();
    this.auxVectors = [...Array(3)].map(() => new Vector3());
    this.visible = false;
  }

  update({
    clock,
    enabled,
    hands,
    note,
  }) {
    this.visible = enabled;
    if (!enabled) {
      return;
    }
    const {
      auxInstance: instance,
      auxVectors: [origin, ...destinations],
    } = this;
    hands.forEach(({ position, quaternion }, hand) => (
      destinations[hand]
        .addVectors(
          position,
          origin.set(0, -0.1 / 3, 0).applyQuaternion(quaternion)
        )
    ));
    origin
      .addVectors(destinations[0], destinations[1])
      .multiplyScalar(0.5);
    destinations.forEach((destination) => destination.sub(origin));
    const len = (note + 1);
    const scalar = 0.7 / len;
    const step = Math.sin(clock) * 0.5;
    for (let i = 0; i < len; i += 1) {
      for (let hand = 0; hand < 2; hand += 1) {
        instance.position
          .copy(destinations[hand])
          .multiplyScalar((i + 1 + step) * scalar)
          .add(origin);
        instance.rotation.set(0, (clock * 0.5) + i, 0);
        instance.updateMatrix();
        this.setMatrixAt((i * 2) + hand, instance.matrix);
      }
    }
    this.count = len * 2;
    this.instanceMatrix.needsUpdate = true;
  }
}

Synth.particles = 30;

export default Synth;
