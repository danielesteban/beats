import {
  BoxBufferGeometry,
  BufferAttribute,
  BufferGeometryUtils,
  Frustum,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
} from '../core/three.js';

// Escher-ish background

class Escher extends InstancedMesh {
  static setupGeometry() {
    const box = (x, y, z, width, height, depth) => {
      const box = new BoxBufferGeometry(width, height, depth, width * 2, height * 2, depth * 2);
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
      geometry.translate(x, y, z);
      return geometry;
    };
    Escher.geometry = BufferGeometryUtils.mergeVertices(
      BufferGeometryUtils.mergeBufferGeometries([
        box(0, 0, -10.5, 20, 1, 1),
        box(-10.5, 0, 0, 1, 1, 20),
        box(-10.5, 0, -10.5, 1, 21, 1),
      ])
    );
    Escher.geometry.computeBoundingSphere();
  }

  static setupMaterial() {
    Escher.material = new MeshBasicMaterial({
      vertexColors: true,
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
            x * 21,
            y * 21,
            z * 21
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
