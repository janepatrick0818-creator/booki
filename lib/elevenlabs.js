import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let client = null;

function getClient() {
  if (!client) {
    client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return client;
}

// Configuration constants
export const ELEVENLABS_CONFIG = {
  defaultVoiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
  defaultModel: "eleven_turbo_v2_5",
  audioFormat: "mp3_22050_32",
  maxTextLength: 5000,
  chunkSize: 2500,
};

// Voice settings presets
export const VOICE_SETTINGS = {
  default: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },
  audiobook: {
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.2,
    use_speaker_boost: true,
  },
};

// Fetch available voices
export async function getVoices() {
  try {
    const elevenlabs = getClient();
    const voices = await elevenlabs.voices.getAll();
    return voices.voices || [];
  } catch (error) {
    console.error("Error fetching voices:", error);
    throw new Error(`Failed to fetch voices: ${error.message}`);
  }
}

// Generate speech from text
export async function generateSpeech(text, voiceId, settings = VOICE_SETTINGS.default) {
  try {
    const elevenlabs = getClient();
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text,
      model_id: ELEVENLABS_CONFIG.defaultModel,
      voice_settings: settings,
      output_format: ELEVENLABS_CONFIG.audioFormat,
    });
    return audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error(`Speech generation failed: ${error.message}`);
  }
}

// Stream speech (for real-time playback)
export async function streamSpeech(text, voiceId, settings = VOICE_SETTINGS.default) {
  try {
    const elevenlabs = getClient();
    const audioStream = await elevenlabs.textToSpeech.stream(voiceId, {
      text,
      model_id: ELEVENLABS_CONFIG.defaultModel,
      voice_settings: settings,
      output_format: ELEVENLABS_CONFIG.audioFormat,
    });
    return audioStream;
  } catch (error) {
    console.error("Error streaming speech:", error);
    throw new Error(`Speech streaming failed: ${error.message}`);
  }
}

// Chunk long text for processing
export function chunkText(text, maxLength = ELEVENLABS_CONFIG.chunkSize) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export default getClient;
