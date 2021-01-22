import {
  InstancedBufferAttribute,
  ShaderMaterial,
  UniformsUtils,
} from '../core/three.js';
import Display from './display.js';

// Sequencer display

class SequencerDisplay extends Display {
  static setupMaterial() {
    if (!Display.material) {
      Display.setupMaterial();
    }
    const material = new ShaderMaterial({
      name: 'sequencer-display-material',
      vertexColors: true,
      fragmentShader: Display.material.fragmentShader
        .replace(
          '#include <common>',
          [
            'varying float vInstanceSequence;',
            'uniform float sequence;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          'vec4 diffuseColor = vec4( diffuse * albedo, opacity );',
          [
            'if (abs(vInstanceSequence - sequence) <= 0.5) { albedo.r = 0.3; }',
            'if (vInstanceIsOn < 0.5 && mod(vInstanceSequence + 0.5, 16.0) <= 1.0) { albedo *= 0.5; }',
            'vec4 diffuseColor = vec4( diffuse * albedo, opacity );',
          ].join('\n')
        ),
      vertexShader: Display.material.vertexShader
        .replace(
          '#include <common>',
          [
            'attribute float instanceSequence;',
            'varying float vInstanceSequence;',
            '#include <common>',
          ].join('\n')
        )
        .replace(
          '#include <begin_vertex>',
          [
            '#include <begin_vertex>',
            'vInstanceSequence = instanceSequence;',
          ].join('\n')
        ),
      uniforms: {
        ...UniformsUtils.clone(Display.material.uniforms),
        sequence: { value: 0 },
      },
    });
    SequencerDisplay.material = material;
  }

  static updateMaterial({ sequence }) {
    if (!Display.material) {
      SequencerDisplay.setupMaterial();
    }
    SequencerDisplay.material.uniforms.sequence.value = sequence;
  }

  constructor(props) {
    if (!SequencerDisplay.material) {
      SequencerDisplay.setupMaterial();
    }
    super({
      ...props,
      material: SequencerDisplay.material,
    });
    const { count, resolution } = this;
    const sequence = new Float32Array(count);
    for (let i = 0, y = 0; y < resolution.y; y += 1) {
      for (let x = 0; x < resolution.x; x += 1, i += 1) {
        sequence[i] = x;
      }
    }
    this.geometry.setAttribute('instanceSequence', new InstancedBufferAttribute(sequence, 1));
  }

  update(pages) {
    const { geometry, resolution } = this;
    const instances = geometry.getAttribute('instanceIsOn');
    pages.forEach((page, y) => page.forEach((isOn, x) => {
      instances.array[((resolution.y - 1 - y) * resolution.x) + x] = isOn ? 1 : 0;
    }));
    instances.needsUpdate = true;
  }
}

export default SequencerDisplay;
