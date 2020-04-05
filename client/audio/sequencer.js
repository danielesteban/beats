import Channel from './channel.js';
import Sample from './sample.js';
import Voice from './voice.js';

class Sequencer {
  constructor({ listener }) {
    this.context = listener.context;
    this.main = new Channel({
      context: this.context,
      filters: [{ type: 'analyser' }],
    });
    const [analyser] = this.main.filters;
    this.main.analyser = analyser;
    this.main.gain = 0.5;
    this.main.output.connect(listener.getInput());
    this.syncTimeOffset();
  }

  init({ bpm, tracks }) {
    this.bpm = bpm;
    if (this.tracks) {
      this.tracks.forEach(({ channel }) => {
        channel.output.disconnect(this.main.input);
      });
    }
    this.tracks = tracks.map(({
      type,
      page,
      pages,
      ...options
    }) => {
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
            .map((v, y) => new Uint8Array([...Array(64)].map((v, x) => (
              page.charCodeAt((y * 64) + x)
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
      bpm,
      context,
      tracks,
      timeOffset: offset,
    } = this;
    if (!tracks || offset === undefined) {
      return;
    }
    const step = 60000 / (bpm * 4);
    const sequence = Math.floor(((Date.now() + offset) / step) % 64);
    if (this.sequence !== sequence) {
      this.sequence = sequence;
      if (context.state === 'running') {
        tracks.forEach(({ page, pages, voices }) => pages[page].forEach((page, voice) => {
          if (page[sequence]) {
            voices[voice].trigger(step / 1000);
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
