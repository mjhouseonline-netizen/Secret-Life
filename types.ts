
export type AppView = 'poster' | 'comic' | 'video' | 'edit' | 'analyze' | 'live' | 'speech' | 'history' | 'distribution' | 'avatar' | 'stitcher' | 'book' | 'settings' | 'analytics';

export type Alignment = 'hero' | 'villain';

export type UserRole = 'user' | 'admin';

export type CloudProvider = 'none' | 'google' | 'icloud';

export interface UserSettings {
  safeMode: boolean;
  hdByDefault: boolean;
  autoCloudSync: boolean;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  credits: number;
  email?: string;
  avatarUrl?: string;
  cloudProvider: CloudProvider;
  cloudAccessToken?: string;
  settings?: UserSettings;
}

export interface CastMember {
  id: string;
  name: string;
  species: string;
  gender: 'male' | 'female';
  traits: string;
  weakness: string;
  alias: string;
  outfit: string;
  referenceImages: string[];
  motivation?: string;
  origin?: string;
  targetWeakness?: string;
}

export interface PosterTemplate {
  id: string;
  name: string;
  alignment: Alignment;
  cast: CastMember[];
  scenario: string;
  style: PosterStyle;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  timestamp: number;
}

export interface CharacterProfile {
  petName: string;
  species: string;
  gender: 'male' | 'female';
  traits: string;
  weakness: string;
  alias?: string;
  alignment: Alignment;
  outfit?: string;
}

export interface ComicMetadata {
  villainName: string;
  villainType: string;
  villainTrait: string;
  pages: number;
  storyEnding: 'triumph' | 'cliffhanger' | 'lesson';
}

export interface BookMetadata {
  title: string;
  genre: string;
  tone: string;
  chapters: number;
  targetAudience: string;
}

export interface CustomVoiceProfile {
  id: string;
  name: string;
  sampleUrl: string;
  analysis: string;
  baseVoice: string;
  quality: number;
  isCleaned: boolean;
}

export interface GeneratedContent {
  id: string;
  type: 'poster' | 'comic' | 'video' | 'edit' | 'analyze' | 'speech' | 'avatar' | 'book';
  url: string;
  prompt: string;
  timestamp: number;
  metadata?: any;
  cloudUrl?: string;
  cloudSynced?: boolean;
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  CLASSIC_P = '2:3',
  CLASSIC_L = '3:2',
  TALL = '3:4',
  WIDE = '4:3',
  CINEMASCOPE = '21:9'
}

export enum StitchTransition {
  CUT = 'Hard Cut',
  FADE = 'Cinematic Fade',
  DISSOLVE = 'Soft Dissolve',
  WIPE = 'Linear Wipe',
  ZOOM = 'Dynamic Zoom'
}

export enum PosterStyle {
  EPIC_LEGEND = 'Epic Legend (Dramatic, Armor, Cinematic)',
  PIXAR_CINEMATIC = 'Pixar Cinematic (Expressive, Saturated, 3D Render)',
  PIXAR_TOY_BOX = 'Pixar Toy Box (Tactile, Early 3D, Vibrant)',
  PIXAR_NATURE = 'Pixar Nature (Lush, Realistic Environments)',
  HEROIC_3D = 'Heroic 3D (Animated, Vibrant, Detailed)',
  SUPERHERO_COMIC = 'Superhero Comic (Action, Explosive, Graphic)',
  URBAN_CINEMATIC = 'Urban Cinematic (Gritty, Night City, Realism)'
}

export enum ComicStyle {
  SHADOW_GUARDIAN = 'The Shadow Guardian (Dark, Gritty, Tech-Hero)',
  PIXAR_3D = 'Pixar 3D Adventure (Soft Surfaces, Big Eyes, Vibrant)',
  PIXAR_CLASSIC = 'Pixar Classic (Early 3D look, High Saturation)',
  CARAMEL_COMET = 'Caramel Comet (Vibrant, Speed-Lines, Elemental)',
  CLASSIC_HERO = 'Classic Golden Age (Bold Colors, Strong Outlines)',
  MODERN_NOIR = 'Modern Noir (High Contrast, Atmospheric)',
  RETRO_POP = 'Retro Pop Art (Ben-Day Dots, Bold Graphics)',
  CYBER_MANGA = 'Cyberpunk Manga (Screentones, High Energy)',
  STORYBOOK = 'Whimsical Storybook (Watercolor, Hand-Drawn)'
}

export enum BookStyle {
  CLASSIC_STORYBOOK = 'Classic Illustrated Storybook',
  LITERARY_NOVEL = 'Literary Novel with Plates',
  KIDS_FANTASY = 'Vibrant Kids Fantasy',
  MYTHIC_MANUSCRIPT = 'Ancient Mythic Manuscript',
  MODERN_THRILLER = 'Modern Cinematic Graphic Novel'
}

export enum AnimationPreset {
  STABLE = 'Stable Static',
  SLOW_PAN = 'Cinematic Slow Pan',
  DYNAMIC_ACTION = 'Dynamic High-Octane Action',
  ORBITAL_SWEEP = 'Dramatic Orbital Sweep',
  DOLLY_ZOOM = 'Vertigo Dolly Zoom',
  HANDHELD_SHAKE = 'Gritty Handheld Shake',
  TIME_LAPSE = 'Ethereal Time-Lapse',
  STOP_MOTION_JITTER = 'Classic Stop-Motion Jitter'
}

export enum VideoStyle {
  DEFAULT = 'Standard Reality',
  CINEMATIC = 'Hyper-realistic Cinematic',
  ANIMATION_3D = '3D Animation Style',
  PIXAR_CINEMATIC = 'Pixar Cinematic Render',
  PIXAR_NATURE = 'Pixar Nature Adventure',
  ANIME = 'Modern Anime Style',
  GHIBLI = 'Ghibli Essence',
  DREAMSCAPE = 'Ethereal Dreamscape',
  MONOCHROME_SKETCH = 'Monochrome Ink Sketch',
  RETRO_SCI_FI = 'Vintage 70s Sci-Fi',
  NOIR = 'Film Noir B&W',
  RETRO = 'Retro 80s VHS',
  CYBERPUNK = 'Cyberpunk Neon Aesthetic',
  CLAYMATION = 'Handcrafted Claymation',
  OIL_PAINTING = 'Moving Oil Painting',
  VAPORWAVE = 'Vaporwave Aesthetic',
  STOP_MOTION = 'Stop-Motion Adventure',
  COMIC_ANIMATION = 'Comic Strip Motion',
  SURREAL_GLITCH = 'Surreal Glitch Art',
  PIXEL_ART = 'Retro Pixel Art',
  STEAMPUNK = 'Victorian Steampunk',
  HOLOGRAM = 'Digital Hologram',
  PAPER_CUTOUT = 'Paper Cutout Style',
  KALEIDOSCOPE = 'Kaleidoscopic Trip',
  SYNTHWAVE = 'Neon Synthwave 80s',
  INK_WASH = 'Traditional Ink Wash',
  MACRO_NATURE = 'Hyper-Detail Macro Nature',
  FANTASY_MAP = 'Animated Ancient Map'
}

export enum ImageSize {
  K1 = '1K',
  K2 = '2K',
  K4 = '4K'
}

export enum Resolution {
  HD = '720p',
  FHD = '1080p'
}

export interface GenerationSettings {
  aspectRatio: AspectRatio;
  resolution?: Resolution;
  imageSize?: ImageSize;
  style?: string;
}
