
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AspectRatio, Resolution, ImageSize, VideoStyle, ComicStyle, PosterStyle, CharacterProfile, ComicMetadata, CastMember, Alignment, BookStyle, BookMetadata, StitchTransition, AnimationPreset } from "../types";

export class GeminiService {
  private static getApiKey(): string {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    return '';
  }

  private static getAI() {
    const apiKey = this.getApiKey();
    return new GoogleGenAI({ apiKey });
  }

  private static getStrictAnatomyPrompt() {
    return `
      --- STRICT ANATOMY GUARD ---
      1. MAINTAIN NATURAL PROPORTIONS: Characters must keep their original natural anatomy.
      2. NO BEEFING UP: Do NOT add human-like muscles to pets.
      3. NO HUMAN FEATURES: Pets must NOT have human facial expressions or stand on two legs. 
      4. NO EXTRA LIMBS: Ensure exactly the natural number of limbs.
      5. PETS REMAIN PETS: Animals must remain visually recognizable.
    `;
  }

  private static getSafetyPrompt(isSafeMode: boolean = true) {
    if (!isSafeMode) return "";
    return ` SAFETY ENFORCEMENT: All content MUST be family-friendly and PG-rated.${this.getStrictAnatomyPrompt()}`;
  }

  private static handleError(error: any) {
    console.error("Gemini API Error:", error);
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("429")) return "Studio busy. Please wait.";
    if (msg.includes("safety") || msg.includes("blocked")) return "Action blocked by safety protocols.";
    return "Studio production error. Please try again.";
  }

  /**
   * Generates a character alias using gemini-3-flash-preview.
   */
  static async generateCharacterAlias(member: CastMember, alignment: Alignment): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a short, punchy comic book alias/codename for a ${alignment} ${member.species} named ${member.name}. Traits: ${member.traits}.`,
        config: { systemInstruction: "Output ONLY the name. No punctuation." }
      });
      return response.text?.trim() || "THE UNKNOWN";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Generates an outfit description using gemini-3-flash-preview.
   */
  static async generateOutfitDescription(member: CastMember, alignment: Alignment, style: PosterStyle): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Describe a detailed cinematic outfit/armor for a ${alignment} ${member.species} character in a ${style} style.`,
        config: { systemInstruction: "One sentence max." }
      });
      return response.text?.trim() || "Standard battle gear.";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generatePosterScenario(cast: CastMember[], alignment: Alignment): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a one-sentence blockbuster scenario for: ${cast.map(c => c.name).join(', ')} (${alignment}).`,
        config: { systemInstruction: this.getStrictAnatomyPrompt() }
      });
      return response.text?.trim() || "An epic showdown begins.";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async editImage(source: string, prompt: string): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: source.split(',')[1], mimeType: 'image/png' } },
            { text: `${prompt} ${this.getSafetyPrompt()}` }
          ]
        }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Edit failed.");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async analyzeContent(data: string, mimeType: string, prompt: string): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: data.split(',')[1], mimeType } },
            { text: prompt }
          ]
        }
      });
      return response.text || "No analysis available.";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Analyzes a voice sample and recommends a prebuilt voice using gemini-3-pro-preview.
   */
  static async analyzeVoice(sampleData: string, sampleMime: string, cleanSample: boolean): Promise<{ description: string, closestPrebuiltVoice: string }> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: sampleData.split(',')[1], mimeType: sampleMime } },
            { text: "Analyze this voice sample. Describe its characteristics (tone, pitch, accent) and suggest which of these prebuilt voices is the closest match: Kore, Puck, Charon, Fenrir, Orpheus, Zephyr, Aoide, Eos, Lyra, Atlas." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              closestPrebuiltVoice: { type: Type.STRING }
            },
            required: ["description", "closestPrebuiltVoice"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generatePoster(scenario: string, aspectRatio: AspectRatio, style: PosterStyle, cast: CastMember[], alignment: Alignment, imageSize: ImageSize = ImageSize.K1, productionType: 'movie' | 'comic' = 'movie') {
    try {
      const ai = this.getAI();
      const castDescs = cast.map(m => `CHARACTER: ${m.name} as "${m.alias}". Species: ${m.species}. Gender: ${m.gender}. OUTFIT: ${m.outfit}.`).join("\n");
      const productionLabel = productionType === 'movie' ? 'Blockbuster movie poster' : 'Comic book variant cover';
      const visualPrompt = `${productionLabel}: ${alignment}. Include dramatic branding, titles, and ${productionType === 'movie' ? 'credit block' : 'issue number/logo trade dress'}. CAST:\n${castDescs}\nSCENE: ${scenario}. STYLE: ${style}. ${this.getSafetyPrompt()}`;
      
      const parts: any[] = [];
      cast.forEach(c => c.referenceImages.forEach(img => parts.push({ inlineData: { data: img.split(',')[1], mimeType: 'image/png' } })));
      parts.push({ text: visualPrompt });

      const response = await ai.models.generateContent({ 
        model: 'gemini-3-pro-image-preview', 
        contents: { parts }, 
        config: { imageConfig: { aspectRatio, imageSize } } 
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Synthesis failed.");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Generates a comic image using gemini-3-pro-image-preview.
   */
  static async generateComic(profile: CharacterProfile, meta: ComicMetadata, style: ComicStyle, sourceImageUrl: string): Promise<string> {
    try {
      const ai = this.getAI();
      const prompt = `4-panel comic strip. STYLE: ${style}. HERO: ${profile.petName} (${profile.species}, ${profile.gender}, ${profile.alignment}) wearing ${profile.outfit}. VILLAIN: ${meta.villainName} (${meta.villainType}). PLOT: ${meta.villainTrait}. STORY ENDING: ${meta.storyEnding}. ${this.getSafetyPrompt()}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            { inlineData: { data: sourceImageUrl.split(',')[1], mimeType: 'image/png' } },
            { text: prompt }
          ]
        },
        config: { imageConfig: { aspectRatio: AspectRatio.LANDSCAPE } }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Comic synthesis failed.");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateVideo(prompt: string, aspectRatio: AspectRatio, resolution: Resolution, style: VideoStyle, referenceImages: string[] = [], baseVideoMeta?: any, transition?: StitchTransition, animationPreset: AnimationPreset = AnimationPreset.STABLE, startingFrameBase64?: string) {
    try {
      const ai = this.getAI();
      const apiKey = this.getApiKey();
      const enhancedPrompt = `STYLE: ${style}. MOTION: ${animationPreset}. ACTION: ${prompt}. ${this.getSafetyPrompt()}`;
      
      const params: any = { 
        model: 'veo-3.1-fast-generate-preview', 
        prompt: enhancedPrompt, 
        config: { numberOfVideos: 1, resolution, aspectRatio } 
      };
      
      if (startingFrameBase64) params.image = { imageBytes: startingFrameBase64.split(',')[1], mimeType: 'image/png' };

      let operation = await ai.models.generateVideos(params);
      while (!operation.done) { 
        await new Promise(r => setTimeout(r, 10000)); 
        operation = await ai.operations.getVideosOperation({ operation }); 
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video synthesis failed.");
      
      const res = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Extends a video using veo-3.1-generate-preview.
   */
  static async extendVideo(videoMeta: any, prompt: string, resolution: Resolution, aspectRatio: AspectRatio, referenceImages: string[], transition: StitchTransition) {
     try {
      const ai = this.getAI();
      const apiKey = this.getApiKey();
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: `${prompt}. TRANSITION: ${transition}. ${this.getSafetyPrompt()}`,
        video: videoMeta,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video extension failed.");
      
      const res = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Stitches two frames together with a generated bridge using veo-3.1-fast-generate-preview.
   */
  static async stitchBridge(startFrame: string, endFrame: string, prompt: string, aspectRatio: AspectRatio, referenceImages: string[]) {
    try {
      const ai = this.getAI();
      const apiKey = this.getApiKey();
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `${prompt}. ${this.getSafetyPrompt()}`,
        image: {
          imageBytes: startFrame.split(',')[1],
          mimeType: 'image/png'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio,
          lastFrame: {
            imageBytes: endFrame.split(',')[1],
            mimeType: 'image/png'
          }
        }
      });

      while (!operation.done) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Stitch bridge failed.");
      
      const res = await fetch(`${downloadLink}&key=${apiKey}`);
      const blob = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  /**
   * Generates a book story and cover image.
   */
  static async generateBook(profile: CharacterProfile, meta: BookMetadata, style: BookStyle, sourceImageUrl?: string): Promise<{ url: string, story: any[] }> {
    try {
      const ai = this.getAI();
      
      const storyResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a ${meta.genre} story titled "${meta.title}" for ${meta.targetAudience}. Tone: ${meta.tone}. Chapters: ${meta.chapters}. Protagonist: ${profile.petName} (${profile.alias}).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["title", "summary"]
            }
          }
        }
      });
      const story = JSON.parse(storyResponse.text || "[]");

      const parts: any[] = [];
      if (sourceImageUrl) parts.push({ inlineData: { data: sourceImageUrl.split(',')[1], mimeType: 'image/png' } });
      parts.push({ text: `Cinematic book cover: "${meta.title}". STYLE: ${style}. Protagonist: ${profile.petName} wearing ${profile.outfit}. ${this.getSafetyPrompt()}` });

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: { imageConfig: { aspectRatio: AspectRatio.PORTRAIT } }
      });

      const part = imageResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData?.data) throw new Error("Cover synthesis failed.");
      
      return {
        url: `data:image/png;base64,${part.inlineData.data}`,
        story
      };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateSpeech(text: string, voice: string = 'Kore') {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({ 
        model: "gemini-2.5-flash-preview-tts", 
        contents: [{ parts: [{ text: `Say clearly and with character: ${text}` }] }], 
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } 
        } 
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) { throw new Error(this.handleError(err)); }
  }
}
