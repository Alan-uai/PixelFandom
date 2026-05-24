class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.port.onmessage = (e) => {
      if (e.data.type === 'audio') {
        this.queue.push(e.data.data);
      } else if (e.data.type === 'interrupt') {
        this.queue = [];
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0];
    if (!output || !output[0]) return true;

    const channel = output[0];
    const available = this.queue.reduce((sum, buf) => sum + buf.length, 0);

    if (available === 0) {
      channel.fill(0);
      return true;
    }

    let written = 0;
    while (written < channel.length && this.queue.length > 0) {
      const buf = this.queue[0];
      const toCopy = Math.min(buf.length, channel.length - written);
      channel.set(buf.subarray(0, toCopy), written);
      written += toCopy;
      if (toCopy < buf.length) {
        this.queue[0] = buf.subarray(toCopy);
      } else {
        this.queue.shift();
      }
    }

    if (written < channel.length) {
      channel.fill(0, written);
    }

    return true;
  }
}

registerProcessor('pcm-playback-processor', PCMProcessor);
