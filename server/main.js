const express = require('express');
const expressWS = require('express-ws');
const helmet = require('helmet');
const path = require('path');
const Songs = require('./songs');

const songs = new Songs();

const defaultRoom = songs.create({
  body: {
    bpm: 100,
    name: 'Default Room',
    root: 'D',
    scale: 'Mixolydian',
  },
});
// 4 on the floor
for (let i = 0; i < 16; i += 1) {
  defaultRoom.tracks[0].pages[0][i * 4] = 1;
  defaultRoom.tracks[0].pages[0][130 + i * 4] = 1;
  if (i % 2 === 0) {
    defaultRoom.tracks[0].pages[0][68 + i * 4] = 1;
  }
}

const server = express();
server.use(helmet());
server.use(express.static(path.join(__dirname, '..', 'client')));
expressWS(server, null, { clientTracking: false, perMessageDeflate: true });
server.ws('/', songs.get.bind(songs));
server.ws('/:song', songs.get.bind(songs));
server.get('/songs', songs.list.bind(songs));
server.put('/songs', songs.create.bind(songs));
server.get('/sync', (req, res) => res.end(`${Date.now()}`));
server.use((req, res) => res.status(404).end());
server.listen(process.env.PORT || 8080);
