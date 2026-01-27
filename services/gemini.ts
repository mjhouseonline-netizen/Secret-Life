
// DO NOT use or import GoogleGenerativeAI from "@google/genai"
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, Resolution, ImageSize, VideoStyle, ComicStyle, PosterStyle, CharacterProfile, ComicMetadata, CastMember, Alignment, BookStyle, BookMetadata, StitchTransition, AnimationPreset } from "../types";

export class GeminiService {
  private static getAI() {
    // ALWAYS use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * App Store Safety Policy:
   * Ensures all generated content is PG-rated, family-friendly, 
   * and contains no prohibited imagery or themes.
   */
  private static getSafetyPrompt(isSafeMode: boolean = true) {
    if (!isSafeMode) return "";
    return ` SAFETY ENFORCEMENT: All generated visuals and text MUST be family-friendly, PG-rated, and suitable for distribution on mobile app stores. Prohibit violence, blood, adult themes, or illegal substances. Maintain a creative, professional, and positive artistic tone.`;
  }

  private static handleError(error: any) {
    console.error("Gemini API Error Details:", error);
    const message = error.message || "";
    if (message.includes("403") || message.includes("PERMISSION_DENIED")) return "Access denied. Enable billing at ai.google.dev/gemini-api/docs/billing.";
    if (message.includes("401") || message.includes("UNAUTHENTICATED")) return "Authentication failed. Re-select your API key.";
    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) return "Rate limit reached. Please wait a moment.";
    if (message.includes("SAFETY")) return "Generation blocked by safety filters. Adjust your prompt.";
    if (message.includes("404") || message.includes("Requested entity was not found")) {
      // Per guidelines, if "Requested entity was not found" occurs, prompt user to select key again.
      (window as any).aistudio?.openSelectKey();
      return "Model or resource not found. Re-selecting your API key may fix this.";
    }
    return message || "A connection error occurred.";
  }

  static async generateCharacterAlias(member: Partial<CastMember>, alignment: Alignment): Promise<string> {
    try {
      const ai = this.getAI();
      const isVillain = alignment === 'villain';
      const prompt = `Generate a unique, cool, and cinematic ${isVillain ? 'VILLAIN' : 'superhero'} name for a ${member.species} named ${member.name}. Traits: ${member.traits}. Return only the name.${this.getSafetyPrompt()}`;
      // Use ai.models.generateContent to query GenAI with both model and prompt
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      // Use .text property, NOT .text() method
      return response.text?.trim() || (isVillain ? "The Shadow" : "The Guardian");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateVillainLore(member: Partial<CastMember>, heroTrait: string): Promise<{ motivation: string; origin: string; targetWeakness: string }> {
    try {
      const ai = this.getAI();
      const prompt = `Generate villainous lore for a ${member.species} named ${member.name} (Alias: ${member.alias}). Opposes a hero with trait "${heroTrait}". Return JSON: {motivation, origin, targetWeakness}. Max 30 words each.${this.getSafetyPrompt()}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });
      // Use .text property, NOT .text() method
      return JSON.parse(response.text || "{}");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateOutfitDescription(member: Partial<CastMember>, alignment: Alignment, style: string): Promise<string> {
    try {
      const ai = this.getAI();
      const prompt = `Generate a detailed cinematic outfit name for a ${alignment} ${member.species}. Personality: ${member.traits}. Movie Aesthetic: ${style}. Return max 12 words.${this.getSafetyPrompt()}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      // Use .text property, NOT .text() method
      return response.text?.trim() || "Epic Gear";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generatePosterScenario(cast: CastMember[], alignment: Alignment): Promise<string> {
    try {
      const ai = this.getAI();
      const names = cast.map(c => `${c.alias} (${c.species})`).join(', ');
      const prompt = `Generate a blockbuster movie scene featuring: ${names}. They are animals in a cinematic story. High-stakes group shot. Max 60 words.${this.getSafetyPrompt()}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });
      // Use .text property, NOT .text() method
      return response.text?.trim() || "An epic showdown.";
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generatePoster(scenario: string, aspectRatio: AspectRatio, style: PosterStyle, cast: CastMember[], alignment: Alignment, imageSize: ImageSize = ImageSize.K1) {
    try {
      const ai = this.getAI();
      const isVillain = alignment === 'villain';
      let styleDescriptor = "";
      switch (style) {
        case PosterStyle.PIXAR_CINEMATIC:
          styleDescriptor = "Modern Pixar-style 3D render. Subsurface scattering, expressive eyes, master fur grooming, saturated colors, professional 3D animated movie aesthetic.";
          break;
        case PosterStyle.PIXAR_TOY_BOX:
          styleDescriptor = "Tactile early-Pixar aesthetic. Plastic toy look, high specular highlights, rounded edges, studio lighting.";
          break;
        case PosterStyle.PIXAR_NATURE:
          styleDescriptor = "Pixar nature 3D. Lush hyper-realistic organic environments, sun-dappled lighting, detailed animal characters.";
          break;
        case PosterStyle.EPIC_LEGEND:
          styleDescriptor = isVillain ? "Dark high-fantasy, moody lighting, obsidian armor." : "High-fantasy epic, golden hour, ornate armor.";
          break;
        case PosterStyle.HEROIC_3D:
          styleDescriptor = "Polished 3D animation. Soft global illumination, vibrant facial features.";
          break;
        case PosterStyle.SUPERHERO_COMIC:
          styleDescriptor = "Dynamic comic book. Action, debris, bold typography.";
          break;
        case PosterStyle.URBAN_CINEMATIC:
          styleDescriptor = "Gritty urban thriller. Night city, rain, atmosphere.";
          break;
        default: styleDescriptor = "Professional cinematic poster.";
      }
      const castDescriptions = cast.map(m => `CHARACTER: ${m.name} as "${m.alias.toUpperCase()}". Species: ${m.species}. Personality: ${m.traits}. OUTFIT: ${m.outfit}.`).join("\n");
      const visualPrompt = `Blockbuster movie poster: ${alignment} group. CAST:\n${castDescriptions}\nSCENE: ${scenario}. STYLE: ${styleDescriptor}. Maintain strict animal anatomy.${this.getSafetyPrompt()}`;
      const allReferenceImages = cast.flatMap(c => c.referenceImages);
      const contents: any = { parts: allReferenceImages.map(img => ({ inlineData: { data: img.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' } })) };
      contents.parts.push({ text: visualPrompt });
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-image-preview', contents, config: { imageConfig: { aspectRatio, imageSize } } });
      for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
      throw new Error("No image data");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateComic(profile: CharacterProfile, comicMeta: ComicMetadata, style: ComicStyle = ComicStyle.SHADOW_GUARDIAN, referenceImageBase64?: string) {
    try {
      const ai = this.getAI();
      let styleText = style === ComicStyle.PIXAR_3D ? "Modern Pixar 3D style. Soft rounded shapes, vibrant colors, professional lighting." : style.toString();
      const storyPrompt = `Professional comic strip, ${comicMeta.pages} panels. Hero ${profile.alias} vs ${comicMeta.villainName}. Style: ${styleText}. Maintain animal anatomy. Hero must match reference. Grid layout.${this.getSafetyPrompt()}`;
      const parts: any[] = [];
      if (referenceImageBase64) parts.push({ inlineData: { data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' } });
      parts.push({ text: storyPrompt });
      const response = await ai.models.generateContent({ model: 'gemini-3-pro-image-preview', contents: { parts }, config: { imageConfig: { aspectRatio: AspectRatio.LANDSCAPE, imageSize: "1K" } } });
      for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
      throw new Error("No comic data");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateVideo(prompt: string, aspectRatio: AspectRatio, resolution: Resolution, style: VideoStyle, referenceImages: string[] = [], baseVideoMeta?: any, transition?: StitchTransition, animationPreset: AnimationPreset = AnimationPreset.STABLE, startingFrameBase64?: string) {
    try {
      const ai = this.getAI();
      let styleDescriptor = "";
      switch (style) {
        case VideoStyle.PIXAR_CINEMATIC: styleDescriptor = "Modern Pixar 3D animation. Subsurface scattering, vibrant saturated colors, ray-traced lighting."; break;
        case VideoStyle.PIXAR_NATURE: styleDescriptor = "Pixar-style nature. Lush environments, charming animated animal protagonists."; break;
        case VideoStyle.CINEMATIC: styleDescriptor = "Hyper-realistic cinema, anamorphic flares, shallow depth."; break;
        case VideoStyle.COMIC_ANIMATION: styleDescriptor = "Motion comic, sequential panels, bold ink lines."; break;
        default: styleDescriptor = "Realistic high-definition video.";
      }
      const enhancedPrompt = `STYLE: ${styleDescriptor}. MOTION: ${animationPreset}. ACTION: ${prompt}. Maintain strict animal anatomy and character consistency with references.${this.getSafetyPrompt()}`;
      
      // Veo Guidelines enforcement for multiple reference images
      const hasMultipleRefs = referenceImages.length > 1;
      const modelName = (hasMultipleRefs || baseVideoMeta || startingFrameBase64) ? 'veo-3.1-generate-preview' : 'veo-3.1-fast-generate-preview';
      
      // For multiple reference images, model must be 'veo-3.1-generate-preview', aspect ratio must be '16:9', and resolution must be '720p'.
      const finalAspectRatio = hasMultipleRefs ? '16:9' : aspectRatio;
      const finalResolution = hasMultipleRefs ? '720p' : resolution;

      const videoConfig: any = { 
        numberOfVideos: 1, 
        resolution: finalResolution, 
        aspectRatio: finalAspectRatio 
      };

      const params: any = { model: modelName, prompt: enhancedPrompt, config: videoConfig };
      if (baseVideoMeta) params.video = baseVideoMeta;
      if (startingFrameBase64) params.image = { imageBytes: startingFrameBase64.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' };
      
      if (referenceImages.length > 0) {
        params.config.referenceImages = referenceImages.map(img => ({ 
          image: { imageBytes: img.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' }, 
          referenceType: 'ASSET' 
        })).slice(0, 3);
      }

      let operation = await ai.models.generateVideos(params);
      while (!operation.done) { 
        await new Promise(r => setTimeout(r, 8000)); 
        operation = await ai.operations.getVideosOperation({ operation }); 
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video failed");
      
      const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob: any = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async extendVideo(previousVideo: any, prompt: string, resolution: Resolution = Resolution.HD, aspectRatio: AspectRatio, referenceImages: string[] = [], transition: StitchTransition) {
    try {
      const ai = this.getAI();
      const enhancedPrompt = `${prompt}. Transition: ${transition}. Maintain character consistency.${this.getSafetyPrompt()}`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: enhancedPrompt,
        video: previousVideo,
        config: {
          numberOfVideos: 1,
          resolution: '720p', // Extension requires 720p resolution per guidelines
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video extension failed");
      const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob: any = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) {
      throw new Error(this.handleError(err));
    }
  }

  static async stitchBridge(startFrame: string, endFrame: string, prompt: string, aspectRatio: AspectRatio, referenceImages: string[] = []) {
    try {
      const ai = this.getAI();
      const enhancedPrompt = `Seamlessly transition between the start and end frame. ${prompt}. Maintain character consistency.${this.getSafetyPrompt()}`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: enhancedPrompt,
        image: {
          imageBytes: startFrame.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          lastFrame: {
            imageBytes: endFrame.replace(/^data:image\/\w+;base64,/, ""),
            mimeType: 'image/png',
          },
          aspectRatio: aspectRatio,
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Stitching bridge failed");
      const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob: any = await res.blob();
      return { url: URL.createObjectURL(blob), videoMeta: operation.response?.generatedVideos?.[0]?.video };
    } catch (err) {
      throw new Error(this.handleError(err));
    }
  }

  static async editImage(source: string, prompt: string) {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { data: source.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' } }, { text: `Edit: ${prompt}. Keep animal anatomy.${this.getSafetyPrompt()}` }] } });
      for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; }
      throw new Error("No edited image");
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async analyzeContent(data: string, mimeType: string, prompt: string) {
    try {
      const ai = this.getAI();
      const base64Data = data.split(',')[1] || data;
      const part = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      };
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [part, { text: `${prompt}${this.getSafetyPrompt()}` }] },
      });
      return response.text;
    } catch (err) {
      throw new Error(this.handleError(err));
    }
  }

  static async analyzeVoice(audioData: string, mimeType: string, clean: boolean) {
    try {
      const ai = this.getAI();
      const base64Data = audioData.split(',')[1] || audioData;
      const cleanPrompt = clean ? "First, digitally clean the audio of background noise and static. Then, " : "";
      const prompt = `${cleanPrompt}Analyze this voice sample for a cinematic production. Identify the following characteristics in JSON format: { "gender": "string", "ageGroup": "string", "pitch": "string", "tone": "string", "accent": "string", "closestPrebuiltVoice": "Kore|Puck|Charon|Fenrir|Orpheus|Zephyr|Aoide|Eos|Lyra|Atlas", "description": "short artistic description" }.${this.getSafetyPrompt()}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] },
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (err) {
      throw new Error(this.handleError(err));
    }
  }

  static async generateBook(profile: CharacterProfile, bookMeta: BookMetadata, style: BookStyle, referenceImage?: string) {
    try {
      const ai = this.getAI();
      const storyPrompt = `Write a cinematic ${bookMeta.genre} story outline for a book titled "${bookMeta.title}". Protagonist: ${profile.alias} (${profile.species}). Tone: ${bookMeta.tone}. Target Audience: ${bookMeta.targetAudience}. Generate ${bookMeta.chapters} chapters. Return JSON: { "chapters": [{ "title": "Chapter Title", "summary": "Detailed summary..." }] }${this.getSafetyPrompt()}`;
      const storyResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: storyPrompt }] }],
        config: { responseMimeType: "application/json" }
      });
      const storyData = JSON.parse(storyResponse.text || '{"chapters": []}');
      let styleText = style.toString();
      const imagePrompt = `A high-end book cover illustration for "${bookMeta.title}". Style: ${styleText}. Featuring ${profile.alias} (${profile.species}) wearing ${profile.outfit || 'heroic gear'}. Cinematic lighting, professional book art.${this.getSafetyPrompt()}`;
      const parts: any[] = [];
      if (referenceImage) parts.push({ inlineData: { data: referenceImage.replace(/^data:image\/\w+;base64,/, ""), mimeType: 'image/png' } });
      parts.push({ text: imagePrompt });
      const imageResponse = await ai.models.generateContent({ model: 'gemini-3-pro-image-preview', contents: { parts }, config: { imageConfig: { aspectRatio: AspectRatio.PORTRAIT, imageSize: ImageSize.K1 } } });
      let url = "";
      for (const part of imageResponse.candidates[0].content.parts) { if (part.inlineData) { url = `data:image/png;base64,${part.inlineData.data}`; break; } }
      return { url, story: storyData.chapters || [] };
    } catch (err) { throw new Error(this.handleError(err)); }
  }

  static async generateSpeech(text: string, voice: string = 'Kore') {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: `${text}${this.getSafetyPrompt()}` }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (err) { throw new Error(this.handleError(err)); }
  }
}
