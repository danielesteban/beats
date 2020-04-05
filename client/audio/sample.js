class Sample {
  constructor({
    context,
    sample,
  }) {
    this.context = context;
    this.output = context.createGain();
    fetch(`/samples/${sample}.${Sample.canPlayOgg ? 'ogg' : 'mp3'}`)
      .then((res) => res.arrayBuffer())
      .then((encoded) => new Promise((resolve, reject) => (
        context.decodeAudioData(encoded, resolve, reject)
      )))
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
}

Sample.canPlayOgg = document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"') !== '';

export default Sample;
