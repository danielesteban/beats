import {
  InstancedBufferAttribute,
} from '../core/three.js';
import Display from './display.js';

// Sequencer display

class SequencerDisplay extends Display {
  static setupMaterial() {
    if (!Display.material) {
      Display.setupMaterial();
    }
    const material = Display.material.clone();
    material.name = 'sequencer-display-material';
    material.defines.USE_SEQUENCE = 1;
    material.uniforms.sequence = { value: 0 };
    SequencerDisplay.material = material;
  }

  static updateMaterialSequence(sequence) {
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
    const sequence = new Float32Array(this.count);
    for (let i = 0, y = 0; y < this.resolution.y; y += 1) {
      for (let x = 0; x < this.resolution.x; x += 1, i += 1) {
        sequence[i] = x;
      }
    }
    this.geometry.setAttribute('instanceSequence', new InstancedBufferAttribute(sequence, 1));
  }
}

export default SequencerDisplay;
