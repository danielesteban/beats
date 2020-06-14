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

let active;
const create = document.getElementById('create');
const songs = document.getElementById('songs');

const fetchSongs = () => fetch('/songs')
  .then((res) => res.json())
  .then((list) => {
    if (!active) {
      active = list[0].id;
    }
    [...songs.getElementsByTagName('a')].forEach((a) => songs.removeChild(a));
    list.forEach((song) => {
      const a = document.createElement('a');
      const name = document.createElement('span');
      const peers = document.createElement('span');
      name.innerText = song.name;
      a.appendChild(name);
      peers.innerText = `${song.peers}`;
      a.appendChild(peers);
      a.addEventListener('click', () => {
        if (song.id !== active) {
          active = song.id;
          renderer.scene.connect(`/${song.id}`, fetchSongs);
        }
      });
      if (song.id === active) {
        a.className = 'active';
      }
      songs.appendChild(a);
    });
  });

create.addEventListener('submit', (e) => {
  e.preventDefault();
  const {
    bars,
    bpm,
    root,
    scale,
  } = e.target;
  create.className = '';
  fetch('/songs', {
    body: JSON.stringify({
      bars: bars.value,
      bpm: bpm.value,
      root: root.value,
      scale: scale.value,
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT',
  })
    .then((res) => res.json())
    .then((id) => {
      active = id;
      renderer.scene.connect(`/${id}`, fetchSongs);
    });
});

const bars = [...document.getElementById('bars').getElementsByTagName('div')];
bars.forEach((button) => (
  button.addEventListener('click', () => {
    bars.forEach((button) => {
      button.className = '';
    });
    button.className = 'active';
    create.bars.value = button.innerText;
  })
));
create.getElementsByTagName('button')[0].addEventListener('click', () => {
  create.className = '';
});
songs.getElementsByTagName('button')[0].addEventListener('click', () => {
  create.className = 'open';
});
[...create.getElementsByTagName('select')].forEach((select) => {
  select.value = select.options[Math.floor(Math.random() * select.options.length)].value;
});
fetchSongs();
