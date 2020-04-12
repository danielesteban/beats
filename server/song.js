const Room = require('./room');

class Song extends Room {
  constructor({
    bpm,
    root,
    scale,
    tracks,
  }) {
    super();
    const { pages, steps, voices } = Song;
    this.bpm = bpm;
    this.root = root;
    this.scale = scale;
    this.tracks = tracks;
    tracks.forEach((track) => {
      track.pages = [...Array(pages)].map(() => Buffer.alloc(voices[track.type] * steps));
      track.page = 0;
    });
  }

  onInit() {
    const {
      bpm,
      root,
      scale,
      tracks,
    } = this;
    return {
      bpm,
      root,
      scale,
      tracks: tracks.map((track) => ({
        ...track,
        pages: track.pages.map((page) => page.toString('base64')),
      })),
    };
  }

  onRequest(client, request) {
    super.onRequest(client, request);
    const { tracks } = this;
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
          || x >= Song.steps
          || Number.isNaN(y)
          || y < 0
          || y >= Song.voices[type]
          || Number.isNaN(isOn)
          || isOn < 0
          || isOn > 1
        ) {
          return;
        }
        pages[page][(y * Song.steps) + x] = isOn;
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
Song.voices = {
  sampler: 4,
  synth: 8,
};

module.exports = Song;
