import {
  BoxGeometry,
  BufferGeometry,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  VertexColors,
} from '../core/three.js';

// Synth particles

class Synth extends InstancedMesh {
  static setupGeometry() {
    const box = new BoxGeometry(0.02, 0.02, 0.02, 2, 2, 2);
    box.faces.forEach((face, i) => {
      if (i % 2 === 1) {
        face.color.offsetHSL(0, 0, Math.random() * -0.1);
        box.faces[i - 1].color.copy(face.color);
      }
    });
    box.rotateY(Math.PI * 0.25);
    box.rotateX(Math.PI * -0.25);
    const geometry = (new BufferGeometry()).fromGeometry(box);
    delete geometry.attributes.normal;
    delete geometry.attributes.uv;
    Synth.geometry = geometry;
  }

  static setupMaterial() {
    Synth.material = new MeshBasicMaterial({
      color: (new Color(0xffe0bd)).convertGammaToLinear(2.2),
      vertexColors: VertexColors,
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
