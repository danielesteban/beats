import Channel from './channel.js';
import Sample from './sample.js';
import Voice from './voice.js';

class Sequencer {
  constructor({ context, input }) {
    this.clock = 0;
    this.context = context;
    this.main = new Channel({ context, gain: 0.5 });
    this.main.output.connect(input);
    this.syncTimeOffset();
  }

  init({
    bpm,
    root,
    scale,
    steps,
    tracks,
  }) {
    const { context, main } = this;
    this.bpm = bpm;
    this.spb = 60 / (bpm * 4);
    if (this.tracks) {
      this.tracks.forEach(({ channel, voices }) => {
        channel.output.disconnect(main.input);
        voices.forEach(({ oscillators }) => {
          if (oscillators) {
            oscillators.forEach((oscillator) => oscillator.stop(context.currentTime));
          }
        });
      });
    }
    this.steps = steps;
    this.tracks = tracks.map(({
      type,
      page,
      pages,
      ...options
    }) => {
      options.root = root;
      options.scale = scale;
      let track;
      switch (type) {
        case 'sampler':
          track = this.createSampler(options);
          break;
        case 'synth':
          track = this.createSynth(options);
          break;
        default:
          throw new Error(`Unsupported track type: ${type}`);
      }
      return {
        ...track,
        page,
        pages: pages.map((page) => {
          page = atob(page);
          return [...Array(track.voices.length)]
            .map((v, y) => new Uint8Array([...Array(steps)].map((v, x) => (
              page.charCodeAt((y * steps) + x)
            ))));
        }),
      };
    });
  }

  createSampler({
    filters,
    gain,
  }) {
    const { context, main } = this;
    const channel = new Channel({
      context,
      filters,
      gain,
    });
    const voices = [
      'kick',
      'snare',
      'hihat',
      'clap',
    ].map((sample) => {
      const voice = new Sample({
        context,
        sample,
      });
      voice.output.connect(channel.input);
      return voice;
    });
    channel.output.connect(main.input);
    return {
      channel,
      voices,
    };
  }

  createSynth({
    filters,
    gain,
    octave,
    root,
    scale,
    waves,
  }) {
    const { context, main } = this;
    const channel = new Channel({
      context,
      filters,
      gain,
    });
    const voices = [...Array(8)].map((v, i) => {
      const voice = new Voice({
        context,
        note: i,
        octave,
        root,
        scale,
        waves,
      });
      voice.output.connect(channel.input);
      return voice;
    });
    channel.output.connect(main.input);
    return {
      channel,
      voices,
    };
  }

  step() {
    const {
      context,
      spb,
      steps,
      tracks,
      timeOffset: offset,
    } = this;
    if (!tracks || offset === undefined) {
      return;
    }
    this.clock = (Date.now() + offset) / 1000 / spb;
    const sequence = Math.floor(this.clock % steps);
    if (this.sequence !== sequence) {
      this.sequence = sequence;
      if (context.state === 'running') {
        tracks.forEach(({ page, pages, voices }) => pages[page].forEach((page, voice) => {
          if (page[sequence]) {
            voices[voice].trigger(spb);
          }
        }));
      }
    }
  }

  syncTimeOffset() {
    const url = new URL(window.location);
    url.pathname = '/sync';
    url.hash = '';
    const fetchTimeOffset = (deltas = []) => (
      fetch(url.toString())
        .then((res) => res.text())
        .then((server) => {
          const client = Date.now();
          deltas.push(parseInt(server, 10) - client);
          if (deltas.length < 10) {
            return fetchTimeOffset(deltas);
          }
          return deltas.reduce((sum, delta) => (sum + delta), 0) / deltas.length;
        })
    );
    fetchTimeOffset()
      .then((offset) => {
        this.timeOffset = offset;
      });
  }
}

export default Sequencer;
