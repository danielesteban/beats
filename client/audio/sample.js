class Sample {
  constructor({
    context,
    sample: name,
  }) {
    this.context = context;
    this.output = context.createGain();
    Sample.getBuffer({ context, name })
      .then((buffer) => {
        this.buffer = buffer;
      });
  }

  trigger() {
    const { buffer, context, output } = this;
    if (!buffer) {
      return;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(output);
    source.start(context.currentTime);
  }

  static getBuffer({ context, name }) {
    return new Promise((resolve, reject) => {
      const { cache, canPlayOgg } = Sample;
      const buffer = cache.get(name);
      if (buffer) {
        resolve(buffer);
        return;
      }
      fetch(`/samples/${name}.${canPlayOgg ? 'ogg' : 'mp3'}`)
        .then((res) => res.arrayBuffer())
        .then((encoded) => new Promise((resolve, reject) => (
          context.decodeAudioData(encoded, resolve, reject)
        )))
        .then((buffer) => {
          cache.set(name, buffer);
          resolve(buffer);
        })
        .catch(reject);
    });
  }
}

Sample.cache = new Map();
Sample.canPlayOgg = document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') !== '';

export default Sample;
