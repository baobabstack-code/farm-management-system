import { ElevenLabsClient } from "elevenlabs";

export class ElevenLabsService {
  private client: ElevenLabsClient | null = null;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    } else {
      console.warn(
        "ELEVENLABS_API_KEY is not set. Voice generation will fail."
      );
    }
  }

  async generateSpeech(text: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error(
        "ElevenLabs API Key is missing. Please configure ELEVENLABS_API_KEY."
      );
    }

    try {
      const audioStream = await this.client.textToSpeech.convert(
        "JBFqnCBsd6RMkjVDRZzb",
        {
          text,
          model_id: "eleven_multilingual_v2",
          output_format: "mp3_44100_128",
        }
      );

      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch (error) {
      console.error("Error generating speech:", error);
      throw error;
    }
  }
}

export const elevenLabsService = new ElevenLabsService();
