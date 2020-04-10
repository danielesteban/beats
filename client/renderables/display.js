import {
  BoxGeometry,
  BoxBufferGeometry,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  VertexColors,
} from '../core/three.js';

// Instanced display

class Display extends InstancedMesh {
  static setupGeometry() {
    const pixel = new BoxGeometry(1, 1, 1, 1, 1, 1);
    pixel.faces.splice(10, 2);
    pixel.faces.forEach((face, i) => {
      if (i % 2 === 1) {
        face.color.setHSL(0, 0, i > 8 ? 1 : 0.5);
        pixel.faces[i - 1].color.copy(face.color);
      }
    });
    Display.geometry = (new BufferGeometry()).fromGeometry(pixel);
    Display.intersectGeometry = new BoxBufferGeometry(1, 1, 1, 1, 1, 1);
    [
      Display.geometry,
      Display.intersectGeometry,
    ].forEach((geometry) => {
      delete geometry.attributes.normal;
      delete geometry.attributes.uv;
    });
  }

  static setupMaterial() {
    const material = new ShaderMaterial({
      name: 'display-material',
      vertexColors: VertexColors,
      fragmentShader: ShaderLib.basic.fragmentShader
        .replace(
          '#include <common>',
          [
            'varying float vInstanceIsOn;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          [
            'vec3 albedo = vInstanceIsOn > 0.5 ? vec3(0.3) : vec3(0.03);',
            'vec4 diffuseColor = vec4( diffuse * albedo, opacity );',
          ].join('\n')
        ),
      vertexShader: ShaderLib.basic.vertexShader
        .replace(
          '#include <common>',
          [
            'attribute float instanceIsOn;',
            'varying float vInstanceIsOn;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            '#include <begin_vertex>',
            'vInstanceIsOn = instanceIsOn;',
          ].join('\n')
        ),
      uniforms: UniformsUtils.clone(ShaderLib.basic.uniforms),
    });
    Display.material = material;
    Display.intersectMaterial = new MeshBasicMaterial({
      visible: false,
    });
  }

  constructor({
    material,
    resolution = {
      x: 1,
      y: 1,
    },
    size = {
      x: 1,
      y: 1,
    },
  }) {
    if (!Display.geometry || !Display.intersectGeometry) {
      Display.setupGeometry();
    }
    if (!Display.material || !Display.intersectMaterial) {
      Display.setupMaterial();
    }
    const count = resolution.x * resolution.y;
    const geometry = Display.geometry.clone();
    super(
      geometry,
      material || Display.material,
      count
    );
    geometry.setAttribute('instanceIsOn', new InstancedBufferAttribute(new Float32Array(count), 1));
    this.resolution = resolution;
    const step = {
      x: size.x / resolution.x,
      y: size.y / resolution.y,
    };
    const origin = {
      x: size.x * -0.5 + step.x * 0.5,
      y: size.y * -0.5 + step.y * 0.5,
    };
    const pixel = new Object3D();
    pixel.scale.set(step.x * 0.75, step.y * 0.75, 0.05);
    for (let i = 0, y = 0; y < resolution.y; y += 1) {
      for (let x = 0; x < resolution.x; x += 1, i += 1) {
        pixel.position.set(
          origin.x + x * step.x,
          origin.y + y * step.y,
          0
        );
        pixel.updateMatrix();
        this.setMatrixAt(i, pixel.matrix);
      }
    }
    this.intersect = new Mesh(
      Display.intersectGeometry,
      Display.intersectMaterial
    );
    this.intersect.scale.set(size.x, size.y, pixel.scale.z);
    this.add(this.intersect);
  }

  dispose() {
    const { children, geometry } = this;
    geometry.dispose();
    children.forEach((child) => {
      if (child.dispose) {
        child.dispose();
      }
    });
  }

  update(state) {
    const { geometry } = this;
    const instances = geometry.getAttribute('instanceIsOn');
    instances.array.set(state);
    instances.needsUpdate = true;
  }
}

export default Display;
