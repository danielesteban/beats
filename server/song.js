const Room = require('./room');

class Song extends Room {
  constructor({
    bars,
    bpm,
    name,
    root,
    scale,
    pages,
  }) {
    super();
    const { tracks, voices } = Song;
    this.bars = bars;
    this.bpm = bpm;
    this.color = Math.floor(Math.random() * 0x100);
    this.name = name;
    this.root = root;
    this.scale = scale;
    this.steps = bars * 16;
    this.tracks = tracks.map((track, i) => ({
      ...track,
      pages: !pages ? (
        [...Array(Song.pages)].map(() => Buffer.alloc(voices[track.type] * this.steps))
      ) : (
        pages[i].map((page) => Buffer.from(page, 'base64'))
      ),
      page: 0,
    }));
    this.needsPersistence = !pages;
  }

  onInit() {
    const {
      bpm,
      color,
      root,
      scale,
      steps,
      tracks,
    } = this;
    return {
      bpm,
      color,
      root,
      scale,
      steps,
      tracks: tracks.map((track) => ({
        ...track,
        pages: track.pages.map((page) => page.toString('base64')),
      })),
    };
  }

  onRequest(client, request) {
    super.onRequest(client, request);
    const { steps, tracks } = this;
    switch (request.type) {
      case 'SET': {
        let {
          track,
          isOn,
          x,
          y,
        } = request.data;
        track = parseInt(track, 10);
        isOn = parseInt(isOn, 10);
        x = parseInt(x, 10);
        y = parseInt(y, 10);
        if (
          Number.isNaN(track)
          || track < 0
          || track >= tracks.length
        ) {
          return;
        }
        const { type, page, pages } = tracks[track];
        if (
          Number.isNaN(x)
          || x < 0
          || x >= steps
          || Number.isNaN(y)
          || y < 0
          || y >= Song.voices[type]
          || Number.isNaN(isOn)
          || isOn < 0
          || isOn > 1
        ) {
          return;
        }
        pages[page][(y * steps) + x] = isOn;
        this.needsPersistence = true;
        this.broadcast({
          type: 'SET',
          data: {
            track,
            isOn,
            x,
            y,
          },
        }, {
          exclude: client.id,
        });
        break;
      }
      case 'PAGE': {
        let {
          track,
          page,
        } = request.data;
        track = parseInt(track, 10);
        page = parseInt(page, 10);
        if (
          Number.isNaN(track)
          || track < 0
          || track >= tracks.length
          || Number.isNaN(page)
          || page < 0
          || page >= Song.pages
        ) {
          return;
        }
        tracks[track].page = page;
        this.broadcast({
          type: 'PAGE',
          data: {
            track,
            page,
          },
        }, {
          exclude: client.id,
        });
        break;
      }
      default:
        break;
    }
  }
}

Song.pages = 4;
Song.steps = 64;
Song.tracks = [
  {
    type: 'sampler',
    gain: 0.5,
  },
  {
    type: 'synth',
    filters: [
      {
        type: 'lowpass',
        frequency: 2048,
      },
    ],
    gain: 0.5,
    octave: 1,
    waves: [
      // Root + double fifth
      { type: 'sine', offset: 0 },
      { type: 'sawtooth', offset: 7 },
      { type: 'square', offset: 14 },
    ],
  },
  {
    type: 'synth',
    filters: [
      {
        type: 'highpass',
        frequency: 1024,
      },
    ],
    gain: 0.5,
    octave: 2,
    waves: [
      // Lead
      { type: 'sine', offset: 0 },
      { type: 'square', offset: 14 },
    ],
  },
];
Song.voices = {
  sampler: 4,
  synth: 8,
};

module.exports = Song;
