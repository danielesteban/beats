class Voice {
  constructor({
    context,
    note,
    octave,
    root,
    scale,
    waves,
  }) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.setValueAtTime(0, context.currentTime);
    const intervals = Voice.scales[
      Object.keys(Voice.scales)[scale]
    ];
    const num = intervals.length + 1;
    const o = Math.floor(note / num);
    const n = Math.floor(note % num);
    note = ((octave + o) * 12) + root;
    for (let i = 0; i < n; i += 1) {
      note += intervals[i];
    }
    this.oscillators = waves.map(({ type, offset }) => {
      const frequency = Voice.frequencies[note + offset];
      const gain = context.createGain();
      const oscillator = context.createOscillator();
      gain.gain.setValueAtTime((1 / waves.length) * 0.5, context.currentTime);
      gain.connect(this.output);
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.connect(gain);
      oscillator.start(context.currentTime);
      return oscillator;
    });
  }

  trigger(duration = 0.1) {
    const { context, output } = this;
    output.gain.cancelScheduledValues(0);
    output.gain.linearRampToValueAtTime(
      1,
      context.currentTime + 0.02
    );
    output.gain.linearRampToValueAtTime(
      0,
      context.currentTime + duration
    );
  }
}

Voice.frequencies = (() => {
  const tuning = 440;
  const equalTemperament = (note) => (
    (2 ** ((note - 69) / 12)) * tuning
  );
  const frequencies = [];
  for (let i = 24; i < 96; i += 1) {
    frequencies.push(equalTemperament(i));
  }
  return frequencies;
})();

Voice.scales = {
  // Chromatic: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  Aeolian: [2, 1, 2, 2, 1, 2],
  Locrian: [1, 2, 2, 1, 2, 2],
  Ionian: [2, 2, 1, 2, 2, 2],
  Dorian: [2, 1, 2, 2, 2, 1],
  Phrygian: [1, 2, 2, 2, 1, 2],
  Lydian: [2, 2, 2, 1, 2, 2],
  Mixolydian: [2, 2, 1, 2, 2, 1],
  'Melodic ascending minor': [2, 1, 2, 2, 2, 2],
  'Phrygian raised sixth': [1, 2, 2, 2, 2, 2],
  'Lydian raised fifth': [2, 2, 2, 2, 1, 2],
  'Major minor': [2, 2, 1, 2, 1, 2],
  Altered: [1, 2, 1, 2, 2, 2],
  Arabic: [1, 2, 2, 2, 1, 3],
};

export default Voice;
