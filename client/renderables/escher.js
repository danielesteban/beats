import {
  BoxGeometry,
  BufferGeometry,
  Frustum,
  Geometry,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  VertexColors,
} from '../core/three.js';

// Escher-ish background

class Escher extends InstancedMesh {
  static setupGeometry() {
    const box = (width, height, length) => {
      const box = new BoxGeometry(width, height, length, width * 2, height * 2, length * 2);
      box.faces.forEach((face, i) => {
        if (i % 2 === 1) {
          face.color.setHSL(0, 0, 0.015 - Math.random() * 0.01);
          box.faces[i - 1].color.copy(face.color);
        }
      });
      return box;
    };
    const merged = new Geometry();
    merged.merge(box(20, 1, 1).translate(0, 0, -10));
    merged.merge(box(1, 1, 20).translate(-10, 0, 0));
    merged.merge(box(1, 20, 1).translate(-10, 0, -10));
    Escher.geometry = (new BufferGeometry()).fromGeometry(merged);
    Escher.geometry.computeBoundingSphere();
  }

  static setupMaterial() {
    Escher.material = new MeshBasicMaterial({
      vertexColors: VertexColors,
    });
  }

  constructor() {
    if (!Escher.geometry) {
      Escher.setupGeometry();
    }
    if (!Escher.material) {
      Escher.setupMaterial();
    }
    const radius = 3;
    const count = (radius * 2 + 1) ** 3;
    super(
      Escher.geometry,
      Escher.material,
      count
    );
    this.aux = {
      frustum: new Frustum(),
      matrix: new Matrix4(),
    };
    this.instances = [];
    for (let i = 0, z = -radius; z <= radius; z += 1) {
      for (let y = -radius; y <= radius; y += 1) {
        for (let x = -radius; x <= radius; x += 1, i += 1) {
          const instance = new Object3D();
          instance.position.set(
            x * 20,
            y * 20,
            z * 20
          );
          instance.updateMatrix();
          instance.worldSphere = Escher.geometry.boundingSphere
            .clone()
            .applyMatrix4(instance.matrix);
          this.instances.push(instance);
        }
      }
    }
  }

  updateFrustum(camera) {
    const {
      aux: { frustum, matrix },
      geometry,
      instances,
    } = this;
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
    let i = 0;
    instances.forEach((instance) => {
      if (frustum.intersectsSphere(instance.worldSphere)) {
        this.setMatrixAt(i, instance.matrix);
        i += 1;
      }
    });
    this.instanceMatrix.needsUpdate = true;
    geometry.count = i;
  }
}

export default Escher;
