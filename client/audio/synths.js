import Channel from './channel.js';
import { Object3D } from '../core/three.js';
import Synth from '../renderables/synth.js';
import Voice from './voice.js';

class Synths {
  constructor({ context, input }) {
    this.context = context;
    this.main = new Channel({ context, gain: 0.5 });
    this.main.output.connect(input);
    this.meshes = new Object3D();
    this.synths = new Map();
  }

  init({ peers, root, scale }) {
    const { context, main, synths } = this;
    synths.forEach(({ channel, voice }) => {
      channel.output.disconnect(main.input);
      voice.oscillators.forEach((oscillator) => (
        oscillator.stop(context.currentTime)
      ));
    });
    synths.clear();
    this.root = root;
    this.scale = scale;
    this.join('player');
    peers.forEach((peer) => this.join(peer));
  }

  join(id) {
    const {
      context,
      main,
      meshes,
      root,
      scale,
      synths,
    } = this;
    const channel = new Channel({
      context,
      filters: [
        { type: 'highpass', frequency: 1024 },
        { type: 'distortion', amount: 512 },
      ],
      gain: 0.5,
      muted: true,
    });
    const mesh = new Synth();
    meshes.add(mesh);
    const voice = new Voice({
      context,
      gain: 1,
      octave: 2,
      root,
      scale,
      waves: [
        { type: 'sine', offset: 0 },
        { type: 'triangle', offset: 12 },
      ],
    });
    voice.output.connect(channel.input);
    channel.output.connect(main.input);
    synths.set(id, {
      channel,
      mesh,
      voice,
    });
  }

  leave(id) {
    const {
      context,
      main,
      meshes,
      synths,
    } = this;
    const { channel, mesh, voice } = synths.get(id);
    channel.output.disconnect(main.input);
    meshes.remove(mesh);
    voice.oscillators.forEach((oscillator) => (
      oscillator.stop(context.currentTime)
    ));
  }

  update({ clock, peers, player }) {
    this.updateSynth({
      clock,
      hands: player.controllers
        .filter(({ hand }) => (!!hand))
        .sort(({ hand: { handedness: a } }, { hand: { handedness: b } }) => b.localeCompare(a))
        .map(({ buttons, worldspace: { position, quaternion } }) => ({
          enabled: buttons.trigger,
          position,
          quaternion,
        })),
      id: 'player',
    });
    peers.forEach(({ peer, controllers }) => (
      this.updateSynth({
        clock,
        hands: controllers
          .filter(({ visible }) => (!!visible))
          .map(({ hand, position, quaternion }) => ({
            enabled: !!(hand.state & (1 << 1)),
            position,
            quaternion,
          })),
        id: peer,
      })
    ));
  }

  updateSynth({ clock, hands, id }) {
    const { synths } = this;
    if (hands.length !== 2) {
      return;
    }
    const [right, left] = hands;
    const enabled = right.enabled || left.enabled;
    const distanceH = Math.min(Math.max(
      right.position.distanceTo({
        x: left.position.x,
        y: right.position.y,
        z: left.position.z,
      }) - 0.1,
      0
    ) / 0.9, 1);
    const distanceV = 1 - Math.min(Math.max(Math.abs(
      right.position.y - left.position.y
    ) * 4, 0), 1);
    const cutoff = (2 ** (1 + Math.floor(4 * distanceV)));
    const { channel, mesh, voice } = synths.get(id);
    const note = Math.floor(
      distanceH * (voice.notes.length - 14)
    );
    channel.muted = !enabled || (Math.floor(clock * 8) % (cutoff * 2)) >= cutoff;
    mesh.update({
      clock: (clock * 16) / cutoff,
      enabled,
      hands,
      note,
    });
    voice.note = note;
  }
}

export default Synths;
