import Channel from '../audio/channel.js';
import Display from '../renderables/display.js';
import Escher from '../renderables/escher.js';
import {
  Color,
  FogExp2,
  Object3D,
  Vector3,
} from '../core/three.js';
import Scene from '../core/scene.js';
import Sequencer from '../audio/sequencer.js';
import SequencerDisplay from '../renderables/sequencerDisplay.js';
import Shadow from '../renderables/shadow.js';
import Spectrum from '../renderables/spectrum.js';
import Stand from '../renderables/stand.js';
import Synths from '../audio/synths.js';
import Translocable from '../renderables/translocable.js';
import Wall from '../renderables/wall.js';

class Song extends Scene {
  constructor(renderer) {
    super(renderer);

    this.auxVector = new Vector3();
    this.background = new Color(0);
    this.fog = new FogExp2(0, 0.03);
    this.scenery = new Escher();
    this.add(this.scenery);

    const floor = new Wall({ width: 20, height: 20, light: 0.6 });
    floor.rotation.set(Math.PI * -0.5, 0, 0);
    this.add(floor);

    const translocable = new Translocable({ width: 20, length: 20, offset: 0.25 });
    this.translocables.push(translocable);
    this.add(translocable);

    {
      const listener = this.player.head;
      this.audio = new Channel({
        context: listener.context,
        filters: [{ type: 'analyser' }],
      });
      const [analyser] = this.audio.filters;
      this.audio.analyser = analyser;
      this.audio.output.connect(listener.getInput());
    }

    this.displays = [];
    this.sequencer = new Sequencer(this.audio);
    this.synths = new Synths(this.audio);
    this.add(this.synths.meshes);
    this.spectrum = new Spectrum();
    this.add(this.spectrum);

    this.player.position.set(
      Math.floor(Math.random() * 4) - 1.5,
      0,
      Math.floor(Math.random() * 4) - 1.5
    );
  }

  onBeforeRender(renderer, scene, camera) {
    super.onBeforeRender(renderer, scene, camera);
    const {
      audio,
      peers,
      player,
      scenery,
      sequencer,
      server,
      spectrum,
      synths,
    } = this;
    SequencerDisplay.updateMaterial(sequencer);
    scenery.updateFrustum(camera);
    player.controllers.forEach((controller) => {
      const {
        hand,
        lastButton,
        raycaster,
      } = controller;
      if (!hand) {
        return;
      }
      const button = this.getButtonAtPosition(raycaster.ray.origin);
      if (button) {
        const { display, x, y } = button;
        if (
          !lastButton
          || lastButton.display !== display
          || lastButton.x !== x
          || lastButton.y !== y
        ) {
          controller.lastButton = { display, x, y };
          const track = sequencer.tracks[display.track];
          switch (display.type) {
            case 'page': {
              const event = {
                type: 'PAGE',
                data: {
                  track: display.track,
                  page: x,
                },
              };
              this.onEvent(event);
              server.send(JSON.stringify(event));
              break;
            }
            case 'track': {
              const event = {
                type: 'SET',
                data: {
                  track: display.track,
                  isOn: track.pages[track.page][y][x] ? 0 : 1,
                  x,
                  y,
                },
              };
              this.onEvent(event);
              server.send(JSON.stringify(event));
              break;
            }
            default:
              break;
          }
        }
      } else if (controller.lastButton) {
        delete controller.lastButton;
      }
    });
    sequencer.step();
    spectrum.update({
      animation: renderer.animation,
      bands: audio.analyser.getBands(),
    });
    synths.update({
      clock: sequencer.clock,
      peers: peers.peers,
      player,
    });
  }

  onEvent(event) {
    super.onEvent(event);
    const { type, data } = event;
    switch (type) {
      case 'INIT':
        this.onInit(data);
        break;
      case 'JOIN':
        this.synths.join(data);
        break;
      case 'LEAVE':
        this.synths.leave(data);
        break;
      case 'PAGE': {
        const { sequencer } = this;
        const track = sequencer.tracks[data.track];
        track.page = data.page;
        track.display.update(track.pages[track.page]);
        track.display.pages.update(
          [...Array(track.pages.length)].map((v, i) => (i === track.page ? 1 : 0))
        );
        break;
      }
      case 'SET': {
        const { sequencer } = this;
        const track = sequencer.tracks[data.track];
        const page = track.pages[track.page];
        page[data.y][data.x] = data.isOn;
        track.display.update(page);
        break;
      }
      default:
        break;
    }
  }

  onInit(data) {
    const {
      background,
      displays,
      fog,
      sequencer,
      synths,
    } = this;
    let color;
    if (data.color < 85) {
      color = [data.color * 3, 255 - data.color * 3, 0];
    } else if (data.color < 170) {
      data.color -= 85;
      color = [255 - data.color * 3, 0, data.color * 3];
    } else {
      data.color -= 170;
      color = [0, data.color * 3, 255 - data.color * 3];
    }
    background.setRGB(...color.map((c) => (c / 512)));
    fog.color.copy(background);
    displays.length = 0;
    if (sequencer.tracks) {
      sequencer.tracks.forEach(({ display, machine }) => {
        display.dispose();
        this.remove(machine);
      });
    }
    sequencer.init(data);
    sequencer.tracks.forEach(({ page, pages }, track) => {
      const state = pages[page];
      const display = new SequencerDisplay({
        size: {
          x: 2,
          y: Math.max(state.length / 8, 0.8),
        },
        resolution: {
          x: state[0].length,
          y: state.length,
        },
      });
      display.type = 'track';
      display.track = track;
      display.position.y = 1.25;
      display.rotateX(Math.PI * -0.2);
      display.update(state);
      {
        const backplate = new Wall({ width: 20, height: 10, light: 0.6 });
        backplate.scale.set(0.105, 0.105, 1);
        backplate.position.z = -0.025;
        display.add(backplate);
      }
      {
        const buttons = new Display({
          size: {
            x: 1.5,
            y: 0.1,
          },
          resolution: {
            x: pages.length,
            y: 1,
          },
        });
        buttons.type = 'page';
        buttons.track = track;
        buttons.update([...Array(pages.length)].map((v, i) => (i === page ? 1 : 0)));
        buttons.scale.set(1, 1, 0.25);
        buttons.position.set(0, -0.59, 0.064);
        buttons.rotateX(Math.PI * -0.2);
        display.pages = buttons;
        display.add(buttons);
        displays.push(buttons);
        const backplate = new Wall({ width: 15, height: 1, light: 0.6 });
        backplate.position.set(0, -0.6, 0.05);
        backplate.scale.set(0.105, 0.16, 1);
        backplate.rotateX(Math.PI * -0.2);
        display.add(backplate);
      }
      displays.push(display);
      const machine = new Object3D();
      machine.add(new Shadow({ width: 2, length: 1 }));
      machine.add(new Stand());
      const angle = Math.PI * (track * 0.2 - 0.2);
      machine.position.set(
        Math.cos(angle - Math.PI * 0.5) * 3.75,
        0,
        Math.sin(angle - Math.PI * 0.5) * 3.75 - 0.5
      );
      machine.rotateY(-angle);
      machine.add(display);
      this.add(machine);
      sequencer.tracks[track].display = display;
      sequencer.tracks[track].machine = machine;
    });
    synths.init(data);
  }

  getButtonAtPosition(position) {
    const { auxVector, displays } = this;
    for (let i = 0; i < displays.length; i += 1) {
      const display = displays[i];
      if (Math.abs(display.intersect.worldToLocal(auxVector.copy(position)).z) <= 1) {
        let { x, y } = auxVector;
        x += 0.5;
        y = 1 - (y + 0.5);
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
          return {
            display,
            x: Math.floor(x * display.resolution.x),
            y: Math.floor(y * display.resolution.y),
          };
        }
      }
    }
    return false;
  }
}

export default Song;
