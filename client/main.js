import Renderer from './core/renderer.js';
import Room from './scenes/room.js';

const renderer = new Renderer({
  debug: {
    fps: document.getElementById('fps'),
    support: document.getElementById('support'),
  },
  mount: document.getElementById('mount'),
});

renderer.loadScene(Room);

const create = document.getElementById('create');
const songs = document.getElementById('songs');

const fetchSongs = () => fetch('/songs')
  .then((res) => res.json())
  .then((list) => {
    [...songs.getElementsByTagName('a')].forEach((a) => songs.removeChild(a));
    list.forEach((song, i) => {
      const a = document.createElement('a');
      const name = document.createElement('span');
      const peers = document.createElement('span');
      name.innerText = song.name;
      a.appendChild(name);
      peers.innerText = `${song.peers}`;
      a.appendChild(peers);
      a.addEventListener('click', () => {
        if (a.className !== 'active') {
          songs.getElementsByClassName('active')[0].className = '';
          a.className = 'active';
          renderer.scene.connect(`/${song.id}`);
        }
      });
      if (i === 0) {
        a.className = 'active';
      }
      songs.appendChild(a);
    });
  });

create.getElementsByTagName('button')[0].addEventListener('click', () => {
  create.className = '';
});
songs.getElementsByTagName('button')[0].addEventListener('click', () => {
  create.className = 'open';
});

create.addEventListener('submit', (e) => {
  e.preventDefault();
  const {
    bpm,
    root,
    scale,
  } = e.target;
  create.className = '';
  fetch('/songs', {
    body: JSON.stringify({
      bpm: bpm.value,
      root: root.value,
      scale: scale.value,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
    .then(fetchSongs);
});

fetchSongs();
