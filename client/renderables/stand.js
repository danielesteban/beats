import {
  BoxGeometry,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  VertexColors,
} from '../core/three.js';

// Display Stand

class Stand extends Mesh {
  static setupGeometry() {
    const box = new BoxGeometry(0.25, 1.15, 0.25, 4, 6, 4);
    box.faces.forEach((face, i) => {
      if (i % 2 === 1) {
        face.color.setHSL(0, 0, 0.015 - Math.random() * 0.01);
        box.faces[i - 1].color.copy(face.color);
      }
    });
    box.translate(0, -0.5, 0);
    const geometry = (new BufferGeometry()).fromGeometry(box);
    delete geometry.attributes.normal;
    delete geometry.attributes.uv;
    Stand.geometry = geometry;
  }

  static setupMaterial() {
    Stand.material = new MeshBasicMaterial({
      vertexColors: VertexColors,
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
