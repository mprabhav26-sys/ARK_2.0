export enum LearningStyle {
  VISUAL = 'Visual',
  AUDITORY = 'Auditory',
  THEORETICAL = 'Theoretical',
  PRACTICAL = 'Code-Focused'
}

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  isLoading?: boolean;
  relatedImage?: string | null; // Base64 string
  relatedAudio?: ArrayBuffer | null; // Raw PCM data
  codeSnippet?: string;
}

export interface UserSettings {
  learningStyle: LearningStyle;
  autoAudio: boolean;
  autoVisual: boolean;
  apiKey: string;
}

export type GeminiModel = 
  | 'gemini-3-flash-preview' 
  | 'gemini-3-pro-preview' 
  | 'gemini-2.5-flash-image'
  | 'gemini-2.5-flash-preview-tts';
