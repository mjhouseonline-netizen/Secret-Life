
export function encode(bytes: Uint8Array): string {
  try {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Encoding error:", e);
    return "";
  }
}

export function decode(base64: string): Uint8Array {
  if (!base64 || typeof base64 !== 'string' || base64.trim() === '') {
    return new Uint8Array(0);
  }
  try {
    // Robust data URI stripping: take everything after the first comma if present
    const commaIndex = base64.indexOf(',');
    const pureBase64 = commaIndex > -1 ? base64.slice(commaIndex + 1) : base64;
    
    // Clean up whitespace or padding issues that might cause atob to throw
    const sanitized = pureBase64.replace(/\s/g, '');
    
    const binaryString = atob(sanitized);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Failed to decode base64 string with 'atob':", e);
    return new Uint8Array(0);
  }
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  try {
    if (data.length === 0) throw new Error("Empty audio data");
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  } catch (e) {
    console.error("Audio decoding error:", e);
    // Return a minimal silent buffer to prevent downstream failures
    return ctx.createBuffer(numChannels, 1, sampleRate);
  }
}

export function createBlob(data: Float32Array): { data: string; mimeType: string } {
  try {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  } catch (e) {
    console.error("Blob creation error:", e);
    return { data: "", mimeType: 'audio/pcm;rate=16000' };
  }
}
