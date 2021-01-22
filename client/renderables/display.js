import {
  BufferAttribute,
  BoxBufferGeometry,
  BufferGeometryUtils,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
} from '../core/three.js';

// Instanced display

class Display extends InstancedMesh {
  static setupGeometry() {
    const pixel = new BoxBufferGeometry(1, 1, 1, 1, 1, 1);
    pixel.deleteAttribute('normal');
    pixel.deleteAttribute('uv');
    const geometry = pixel.toNonIndexed();
    geometry.setAttribute('position', new BufferAttribute(geometry.getAttribute('position').array.slice(0, 90), 3));
    const { count } = geometry.getAttribute('position');
    const color = new BufferAttribute(new Float32Array(count * 3), 3);
    let light;
    for (let i = 0; i < count; i += 1) {
      if (i % 6 === 0) {
        light = i >= 24 ? 1 : 0.5;
      }
      color.setXYZ(i, light, light, light);
    }
    geometry.setAttribute('color', color);
    Display.geometry = BufferGeometryUtils.mergeVertices(geometry);
    Display.intersectGeometry = pixel;
  }

  static setupMaterial() {
    const material = new ShaderMaterial({
      name: 'display-material',
      vertexColors: true,
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
