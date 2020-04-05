const compression = require('compression');
const express = require('express');
const expressWS = require('express-ws');
const helmet = require('helmet');
const path = require('path');
const Song = require('./song');

const root = 2; // D
const scale = 6; // Mixolydian
const room = new Song({
  bpm: 100,
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
      root,
      scale,
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
      root,
      scale,
      waves: [
        // Lead
        { type: 'sine', offset: 0 },
        { type: 'square', offset: 14 },
      ],
    },
  ],
});

const server = express();
server.use(compression());
server.use(helmet());
server.use(express.static(path.join(__dirname, '..', 'client')));
expressWS(server, null, { clientTracking: false, perMessageDeflate: true });
server.ws('/', room.onClient.bind(room));
server.get('/sync', (req, res) => res.end(`${Date.now()}`));
server.use((req, res) => res.status(404).end());
server.listen(process.env.PORT || 8080);


// Hacky song
[
  [0, 0],
  [1, 0],
  [3, 0],
  [4, 0],
  [8, 0],
  [12, 0],
  [16, 0],
  [20, 0],
  [24, 0],
  [28, 0],

  [2, 2],
  [6, 2],
  [10, 2],
  [11, 2],
  [14, 2], [14, 3],
  [18, 2],
  [22, 2],
  [26, 2],
  [30, 2],

  [4, 1],
  [12, 1],
  [20, 1],
  [28, 1],

  [32, 0],
  [33, 0],
  [35, 0],
  [36, 0],
  [40, 0],
  [44, 0],
  [48, 0],
  [52, 0],
  [56, 0],
  [60, 0],

  [34, 2],
  [38, 2],
  [42, 2],
  [43, 2],
  [46, 2], [46, 3],
  [50, 2],
  [54, 2],
  [58, 2],
  [62, 2],

  [36, 1],
  [44, 1],
  [52, 1],
  [60, 1],
].forEach(([x, y]) => {
  room.tracks[0].pages[0][(y * 64) + x] = 1;
});

[
  [0, 0],
  [1, 0],
  [3, 0],
  [4, 0],
  [6, 2],
  [8, 3],
  [12, 3],
  [16, 5],
  [18, 5],
  [20, 5],
  [21, 7],
  [26, 3],
  [30, 3],

  [32, 0],
  [33, 0],
  [35, 0],
  [36, 0],
  [38, 2],
  [40, 3],
  [44, 3],
  [48, 7],
  [50, 5],
  [52, 7],
  [53, 5],
  [56, 1],
  [57, 0],
  [59, 7],
  [62, 3],
].forEach(([x, y]) => {
  room.tracks[1].pages[0][(y * 64) + x] = 1;
});

[
  [4, 5],
  [6, 5],
  [8, 4],
  [12, 3],
  [16, 5],
  [22, 0],
  [24, 2],
  [26, 3],

  [36, 5],
  [38, 5],
  [40, 4],
  [44, 7],
  [48, 5],
  [56, 3],
  [57, 5],
  [59, 7],
  [62, 3],
].forEach(([x, y]) => {
  room.tracks[2].pages[0][(y * 64) + x] = 1;
});
