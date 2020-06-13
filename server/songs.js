const namor = require('namor');
const Song = require('./song');

class Songs {
  constructor() {
    this.cache = new Map();
  }

  create(req, res) {
    const { AllowedRoots, AllowedScales } = Songs;
    let {
      bpm,
      root,
      scale,
    } = req.body;
    bpm = parseInt(bpm, 10);
    root = `${root}`;
    scale = `${scale}`;
    if (
      Number.isNaN(bpm)
      || bpm < 60
      || bpm > 240
      || AllowedRoots.indexOf(root) === -1
      || AllowedScales.indexOf(scale) === -1
    ) {
      if (res) {
        res.status(422).end();
      }
      return false;
    }
    const { cache } = this;
    const song = new Song({
      bpm,
      name: namor.generate({ words: 3, saltLength: 0 }),
      root,
      scale,
      tracks: [
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
      ],
    });
    cache.set(song.id, song);
    if (res) {
      res.status(200).end();
    }
    return song;
  }

  list(req, res) {
    const { cache } = this;
    res.json([...cache.values()].map(({ id, clients, name }) => ({
      id,
      name,
      peers: clients.length,
    })));
  }

  get(client, req) {
    const { cache } = this;
    const song = cache.get(req.params.song ? `${req.params.song}` : cache.entries().next().value[0]);
    if (!song) {
      client.send(JSON.stringify({
        type: 'ERROR',
        data: 'Song not found!',
      }), () => {});
      client.terminate();
      return;
    }
    song.onClient(client);
  }
}

Songs.AllowedRoots = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

Songs.AllowedScales = [
  'Aeolian',
  'Locrian',
  'Ionian',
  'Dorian',
  'Phrygian',
  'Lydian',
  'Mixolydian',
  'Melodic ascending minor',
  'Phrygian raised sixth',
  'Lydian raised fifth',
  'Major minor',
  'Altered',
  'Arabic',
];

module.exports = Songs;
