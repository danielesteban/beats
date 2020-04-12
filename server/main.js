const compression = require('compression');
const express = require('express');
const expressWS = require('express-ws');
const helmet = require('helmet');
const path = require('path');
const Song = require('./song');

const room = new Song({
  bpm: 100,
  root: 'D',
  scale: 'Mixolydian',
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

// 4 on the floor
for (let i = 0; i < 16; i += 1) {
  room.tracks[0].pages[0][i * 4] = 1;
  room.tracks[0].pages[0][130 + i * 4] = 1;
  if (i % 2 === 0) {
    room.tracks[0].pages[0][68 + i * 4] = 1;
  }
}

const server = express();
server.use(compression());
server.use(helmet());
server.use(express.static(path.join(__dirname, '..', 'client')));
expressWS(server, null, { clientTracking: false, perMessageDeflate: true });
server.ws('/', room.onClient.bind(room));
server.get('/sync', (req, res) => res.end(`${Date.now()}`));
server.use((req, res) => res.status(404).end());
server.listen(process.env.PORT || 8080);
