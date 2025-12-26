
export type FileType = 'image' | 'video' | 'document' | 'audio' | 'unsupported';
export type Language = 'en' | 'es' | 'fr' | 'ar' | 'zh' | 'hi' | 'tr' | 'am' | 'de' | 'pt' | 'ru' | 'ja' | 'om';

export interface AnalysisFinding {
  finding: string;
  explanation: string;
  verdict: 'Authentic' | 'Suspicious' | 'Manipulated';
}

export interface PublicResearchFinding {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
}

export interface DocumentReference {
  title: string;
  url: string;
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface AnalysisResult {
  trustScore: number;
  status: 'Authentic' | 'Suspicious' | 'Likely Fake' | 'Inconclusive';
  summary: string;
  findings: AnalysisFinding[];
  publicResearch?: PublicResearchFinding[];
  documents?: DocumentReference[];
  sources?: SourceLink[];
  language?: Language;
}

export interface AnalysisHistoryItem {
  id: string;
  fileName: string;
  timestamp: string;
  result: AnalysisResult;
}

export interface VideoMetadata {
  duration: number;
  videoWidth: number;
  videoHeight: number;
}

export interface ProcessedVideo {
  frames: string[];
  metadata: VideoMetadata;
  audioTranscript: string;
}