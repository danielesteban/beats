import Display from '../renderables/display.js';
import Escher from '../renderables/escher.js';
import { FogExp2, Vector3 } from '../core/three.js';
import Scene from '../core/scene.js';
import Sequencer from '../audio/sequencer.js';
import SequencerDisplay from '../renderables/sequencerDisplay.js';
import Spectrum from '../renderables/spectrum.js';
import Stand from '../renderables/stand.js';
import Translocable from '../renderables/translocable.js';
import Wall from '../renderables/wall.js';

class Room extends Scene {
  constructor(renderer) {
    super(renderer);

    this.auxVector = new Vector3();
    this.displays = [];
    this.fog = new FogExp2(0, 0.03);

    const floor = new Wall({ width: 20, height: 20, light: 0.6 });
    floor.rotation.set(Math.PI * -0.5, 0, 0);
    this.add(floor);

    const translocable = new Translocable({ width: 20, length: 20, offset: 0.25 });
    this.translocables.push(translocable);
    this.add(translocable);

    this.background = new Escher();
    this.add(this.background);

    this.sequencer = new Sequencer({ listener: this.player.head });
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
      background,
      player,
      sequencer,
      server,
      spectrum,
    } = this;
    SequencerDisplay.updateMaterialSequence(sequencer.sequence);
    background.updateFrustum(camera);
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
      bands: sequencer.main.analyser.getBands(),
    });
  }

  onEvent(event) {
    super.onEvent(event);
    const { type, data } = event;
    switch (type) {
      case 'INIT':
        this.onInit(data);
        break;
      case 'PAGE': {
        const { sequencer } = this;
        const track = sequencer.tracks[data.track];
        track.page = data.page;
        track.display.update(track.pages[track.page]);
        track.display.pages.update(
          [[...Array(track.pages.length)].map((v, i) => (i === track.page ? 1 : 0))]
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
    const { displays, sequencer } = this;
    displays.length = 0;
    if (sequencer.tracks) {
      sequencer.tracks.forEach(({ display }) => {
        this.remove(display);
        display.dispose();
      });
    }
    sequencer.init(data);
    sequencer.tracks.forEach(({ page, pages }, track) => {
      const state = pages[page];
      const display = new SequencerDisplay({
        size: {
          x: 1.5,
          y: Math.max(state.length / 8, 0.8),
        },
        resolution: {
          x: state[0].length,
          y: state.length,
        },
      });
      display.type = 'track';
      display.track = track;
      display.position.set(
        track * 2 - 2,
        1.2,
        -3
      );
      display.rotateX(Math.PI * -0.25);
      display.update(state);
      {
        const backplate = new Wall({ width: 10, height: 10, light: 0.6 });
        backplate.scale.set(0.16, 0.105, 1);
        backplate.position.z = -0.05;
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
        buttons.update([[...Array(pages.length)].map((v, i) => (i === page ? 1 : 0))]);
        buttons.scale.set(1, 1, 0.25);
        buttons.position.set(0, -0.59, 0.064);
        buttons.rotateX(Math.PI * -0.25);
        display.pages = buttons;
        display.add(buttons);
        displays.push(buttons);
        const backplate = new Wall({ width: 10, height: 1, light: 0.6 });
        backplate.position.set(0, -0.6, 0.05);
        backplate.scale.set(0.16, 0.16, 1);
        backplate.rotateX(Math.PI * -0.25);
        display.add(backplate);
      }
      {
        const stand = new Stand();
        stand.position.set(0, 0, -0.15);
        stand.rotateX(Math.PI * 0.25);
        display.add(stand);
      }
      displays.push(display);
      sequencer.tracks[track].display = display;
      this.add(display);
    });
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

export default Room;
