class Voice {
  constructor({
    context,
    gain = 0,
    note = 0,
    octave,
    root,
    scale,
    waves,
  }) {
    this.context = context;
    this.output = context.createGain();
    this.output.gain.setValueAtTime(gain, context.currentTime);

    this.oscillators = waves.map(({ type, offset }) => {
      const gain = context.createGain();
      gain.gain.setValueAtTime((1 / waves.length) * 0.5, context.currentTime);
      gain.connect(this.output);
      const oscillator = context.createOscillator();
      oscillator.offset = offset;
      oscillator.type = type;
      oscillator.connect(gain);
      oscillator.start(context.currentTime);
      return oscillator;
    });

    const { scales, roots } = Voice;
    root = roots.indexOf(root);
    scale = scales[scale];
    this.notes = [];
    for (let o = 0; o < 4; o += 1) {
      let note = ((octave + o) * 12) + root;
      this.notes.push(note);
      scale.forEach((interval) => {
        note += interval;
        this.notes.push(note);
      });
    }

    this.note = note;
  }

  get note() {
    return this._note;
  }

  set note(value) {
    const { context, notes, oscillators } = this;
    if (this._note === value) {
      return;
    }
    this._note = value;
    oscillators.forEach(({ frequency, offset }) => {
      frequency.cancelScheduledValues(0);
      frequency.linearRampToValueAtTime(
        Voice.frequencies[notes[value] + offset],
        context.currentTime + 0.02
      );
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

Voice.roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
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
  Eastern: [1, 2, 2, 2, 1, 3],
};

export default Voice;
