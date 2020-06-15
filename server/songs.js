const fs = require('fs');
const path = require('path');
const namor = require('namor');
const Song = require('./song');

class Songs {
  constructor({ storage }) {
    this.cache = new Map();
    this.storage = storage;
    if (storage) {
      if (!fs.existsSync(storage)) {
        fs.mkdirSync(storage, { recursive: true });
      }
      this.load();
      setInterval(() => this.persist(), 60000);
    }
  }

  create(req, res) {
    const { AllowedRoots, AllowedScales } = Songs;
    let {
      bars,
      bpm,
      root,
      scale,
    } = req.body;
    bars = parseInt(bars, 10);
    bpm = parseInt(bpm, 10);
    root = `${root}`;
    scale = `${scale}`;
    if (
      Number.isNaN(bars)
      || (bars !== 2 && bars !== 4)
      || Number.isNaN(bpm)
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
      bars,
      bpm,
      name: namor.generate({ words: 3, saltLength: 0 }),
      root,
      scale,
    });
    cache.set(song.id, song);
    if (res) {
      res.json(song.id).end();
    }
    return song;
  }

  get(client, req) {
    const { cache } = this;
    const song = cache.get(req.params.song ? `${req.params.song}` : [...cache.keys()].reverse()[0]);
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

  list(req, res) {
    const { cache } = this;
    res.json([...cache.values()].reverse().map(({ id, clients, name }) => ({
      id,
      name,
      peers: clients.length,
    })));
  }

  load() {
    const { cache, storage } = this;
    let stored;
    try {
      stored = JSON.parse(fs.readFileSync(path.join(storage, 'songs.json')));
    } catch (e) {
      return;
    }
    stored.forEach(({
      bars,
      bpm,
      name,
      root,
      scale,
      tracks,
    }) => {
      const song = new Song({
        bars,
        bpm,
        name,
        root,
        scale,
        pages: tracks,
      });
      cache.set(song.id, song);
    });
  }

  persist() {
    const { cache, storage } = this;
    const songs = [...cache.values()];
    if (!songs.reduce((persist, { needsPersistence }) => (
      persist || needsPersistence
    ), false)) {
      return;
    }
    console.log('persisted!');
    fs.writeFileSync(path.join(storage, 'songs.json'), JSON.stringify(songs.map(({
      bars,
      bpm,
      name,
      root,
      scale,
      tracks,
    }) => ({
      bars,
      bpm,
      name,
      root,
      scale,
      tracks: tracks.map((track) => (
        track.pages.map((page) => page.toString('base64'))
      )),
    }))));
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
  'Eastern',
];

module.exports = Songs;
