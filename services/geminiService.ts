
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, FileType, Language, ProcessedVideo } from '../types';
import { fileToBase64 } from '../utils/fileUtils';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const MASTER_SYSTEM_PROMPT = `You are a world-class forensic AI verification system named 'Veritas'.
Your mission is to detect manipulation, AI generation, or any form of falsification in digital media.
You must conduct a thorough analysis of all available data, including metadata, file structure, visual/auditory patterns, and content.
In addition to your internal analysis, you MUST perform public research by searching for the content online to find context, original sources, and fact-checks from reputable outlets.
Your output must be neutral, factual, and strictly based on evidence from both your internal analysis and public research.
Provide clear, explainable results. If the evidence is insufficient for a definitive conclusion, you must state the result as "Inconclusive".
Never guess or fabricate information. Your credibility is paramount.
Populate all fields of the JSON schema, including 'publicResearch', 'documents', and 'sources'. If no information is found for a field, return an empty array for it.`;

const getPromptForFileType = (type: FileType, hasProcessedVideo: boolean = false): string => {
  switch (type) {
    case 'image':
      return 'Analyze this image for any signs of AI generation (e.g., Midjourney, DALL-E) or digital manipulation (e.g., Photoshop). Scrutinize metadata (EXIF), lighting consistency, shadow integrity, facial symmetry, pixel-level noise patterns, and for any known AI watermarks or artifacts. Cross-reference with reverse image search databases.';
    case 'video':
      if (hasProcessedVideo) {
          return 'Analyze this sequence of video frames and the accompanying audio transcript for deepfake characteristics or digital manipulation. Perform a frame-by-frame analysis to check for continuity errors. Scrutinize facial movements, especially eye blinking and expressions, for unnatural patterns. Verify lip-sync accuracy by comparing the transcript to the frames. Look for artifacts common in AI-generated or edited videos across the frame sequence. The audio transcript is provided for context.';
      }
      return 'Analyze this video for deepfake characteristics or digital manipulation. Perform a frame-by-frame analysis to check for continuity errors. Scrutinize facial movements, especially eye blinking and expressions, for unnatural patterns. Verify lip-sync accuracy and check for audio-video mismatches. Look for artifacts common in AI-generated or edited videos.';
    case 'document':
      return 'Forensically analyze this document (PDF/Word) for evidence of editing, forgery, or AI-generated text. Examine metadata for revision history and author information. Analyze font consistency, formatting, and layout for anomalies. Check for forged signatures, altered dates, or fake stamps. Score the text for AI-generation probability using stylistic and linguistic analysis.';
    case 'audio':
        return 'Analyze this audio file for signs of AI generation, splicing, or manipulation. Examine the waveform and spectrogram for inconsistencies, unnatural noise floor changes, or artifacts. Analyze vocal patterns, pitch, and cadence for characteristics of AI voice synthesis. If it is a recording of a real event, check for edits or tampering.';
    default:
      throw new Error("Unsupported file type for prompt generation");
  }
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        trustScore: { 
            type: Type.INTEGER,
            description: "A numerical score from 0 to 100 representing the authenticity of the file. 0 is definitively fake, 100 is completely authentic." 
        },
        status: { 
            type: Type.STRING,
            enum: ['Authentic', 'Suspicious', 'Likely Fake', 'Inconclusive'],
            description: "A single-word verdict based on the trust score. Authentic: 85-100, Suspicious: 40-84, Likely Fake: 0-39, Inconclusive if unsure."
        },
        summary: {
            type: Type.STRING,
            description: "A concise, one-paragraph summary of the overall findings."
        },
        findings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    finding: { type: Type.STRING, description: "A short title for the specific finding, e.g., 'Metadata Anomaly' or 'Consistent Pixel Pattern'." },
                    explanation: { type: Type.STRING, description: "A detailed explanation of this specific finding and why it impacts the trust score." },
                    verdict: { type: Type.STRING, enum: ['Authentic', 'Suspicious', 'Manipulated'], description: "The verdict for this specific finding." }
                },
                required: ['finding', 'explanation', 'verdict']
            },
            description: "An array of specific forensic findings, both positive and negative."
        },
        publicResearch: {
            type: Type.ARRAY,
            description: "Findings from public research on the web, including fact-checking sites and news articles. Leave empty if no relevant information is found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The headline or title of the research finding." },
                    summary: { type: Type.STRING, description: "A brief summary of what the public source says about the content." },
                    sourceUrl: { type: Type.STRING, description: "The direct URL to the source article or page." },
                    sourceName: { type: Type.STRING, description: "The name of the source (e.g., 'Reuters', 'Snopes')." }
                },
                required: ['title', 'summary', 'sourceUrl', 'sourceName']
            }
        },
        documents: {
            type: Type.ARRAY,
            description: "Links to relevant source documents or official reports found during the analysis. Leave empty if none are found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "The title of the document." },
                    url: { type: Type.STRING, description: "The direct URL to the document." }
                },
                required: ['title', 'url']
            }
        },
        sources: {
            type: Type.ARRAY,
            description: "A list of primary sources used for verification, including the original source of the media if found.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A descriptive title for the source link." },
                    url: { type: Type.STRING, description: "The direct URL of the source." }
                },
                required: ['title', 'url']
            }
        }
    },
    required: ['trustScore', 'status', 'summary', 'findings']
};

const getLanguageName = (lang: Language): string => {
  const languageMap: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    ar: 'Arabic',
    zh: 'Chinese',
    hi: 'Hindi',
    tr: 'Turkish',
    am: 'Amharic',
    de: 'German',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    om: 'Oromo',
  };
  return languageMap[lang];
};

export const analyzeFile = async (
  fileOrData: File | ProcessedVideo,
  fileType: FileType,
  language: Language
): Promise<AnalysisResult> => {
  const languageName = getLanguageName(language);
  const systemInstruction = `${MASTER_SYSTEM_PROMPT}\n\nIMPORTANT: Your entire response, including all fields in the JSON output (summary, findings, etc.), MUST be in ${languageName}.`;

  let contents;
  let prompt;

  if (fileType === 'video' && 'frames' in fileOrData) {
    // This is our processed video data
    const processedData = fileOrData as ProcessedVideo;
    prompt = getPromptForFileType(fileType, true);
    
    const parts: any[] = [{ text: `${prompt}\n\nAudio Transcript: ${processedData.audioTranscript}\n\nMetadata: ${JSON.stringify(processedData.metadata)}` }];
    
    // Add frames as inline data
    processedData.frames.forEach(frameBase64 => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: frameBase64,
        },
      });
    });
    
    contents = { parts };
  } else {
    // This is the original logic for a single file
    const file = fileOrData as File;
    const base64Data = await fileToBase64(file);
    prompt = getPromptForFileType(fileType);

    contents = {
      parts: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    };
  }
  
  const modelName = 'gemini-3-pro-preview';

  try {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
            temperature: 0.2,
        }
    });
    
    const text = response.text;
    if (!text) {
        throw new Error("Received an empty response from the AI.");
    }

    const parsedResult = JSON.parse(text);
    return parsedResult as AnalysisResult;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a valid analysis from the AI model.");
  }
};

export const translateText = async (text: string, language: Language): Promise<string> => {
  const languageName = getLanguageName(language);
  const prompt = `Translate the following text into ${languageName}. Respond with only the translated text, without any additional commentary or quotation marks.
  
  Text: "${text}"`;

  const modelName = 'gemini-3-flash-preview';

  try {
      const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
              temperature: 0.3,
          }
      });

      const translatedText = response.text;
      if (!translatedText) {
          throw new Error("Received an empty translation from the AI.");
      }
      return translatedText.trim();
  } catch (error) {
      console.error("Gemini API call for translation failed:", error);
      throw new Error("Failed to get a valid translation from the AI model.");
  }
};

export const translateAnalysisResult = async (
  result: AnalysisResult,
  language: Language
): Promise<AnalysisResult> => {
  const languageName = getLanguageName(language);
  const resultJsonString = JSON.stringify(result, null, 2);

  const prompt = `Translate the user-facing text fields ('summary', 'finding', 'explanation', and the 'title' and 'summary' fields within 'publicResearch', 'title' in 'documents', and 'title' in 'sources') in the following JSON object into ${languageName}.
  - Maintain the exact original JSON structure.
  - Do NOT translate field names (keys).
  - Do NOT alter non-text values like URLs, 'trustScore', 'status', or 'verdict'.
  - Your output MUST be a valid JSON object conforming to the provided schema.

  JSON to translate:
  ${resultJsonString}`;

  const systemInstruction = `You are an expert multilingual translator specializing in structured data. Your task is to translate specific text fields within a JSON object while preserving its structure and non-textual data perfectly.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const translatedText = response.text;
    if (!translatedText) {
      throw new Error('Received an empty response from the AI for translation.');
    }
    
    const parsedResult = JSON.parse(translatedText);
    return parsedResult as AnalysisResult;

  } catch (error) {
    console.error('Gemini API call failed for result translation:', error);
    throw new Error('Failed to get a valid translation from the AI model.');
  }
};