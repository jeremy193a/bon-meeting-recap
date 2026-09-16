import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import { config } from '../config.js';
import type { MeetingRecapData } from '../types.js';

/**
 * Creates a Google GenAI client instance.
 * Allows overriding API key from client request header if provided.
 */
export function getGeminiClient(customApiKey?: string | null): GoogleGenAI {
  const apiKey = customApiKey || config.geminiApiKey;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add it to your .env file or enter it in the web interface.',
    );
  }
  return new GoogleGenAI({ apiKey });
}

export interface ProcessAudioOptions {
  filePath: string;
  mimeType: string;
  displayName?: string;
  customApiKey?: string | null;
  customPrompt?: string;
}

const DEFAULT_RECAP_PROMPT = `
Bạn là một chuyên gia thư ký cuộc họp cao cấp.
Nhiệm vụ của bạn: Nghe bản ghi âm cuộc họp đính kèm và trích xuất bản tóm tắt cuộc họp (Meeting Recap) chính xác, mạch lạc, súc tích bằng tiếng Việt.

Hãy trả về DUY NHẤT một JSON object hợp lệ theo schema sau:
{
  "title": "Tiêu đề ngắn gọn phản ánh đúng trọng tâm cuộc họp",
  "language": "vi",
  "durationEstimate": "Ước lượng thời gian cuộc họp (ví dụ: ~20 phút)",
  "executiveSummary": "Đoạn tóm tắt tổng quan 3-5 câu nêu bối cảnh, mục đích và kết quả then chốt",
  "decisions": [
    "Quyết định dứt khoát 1",
    "Quyết định dứt khoát 2"
  ],
  "actionItems": [
    {
      "task": "Nhiệm vụ cụ thể cần triển khai",
      "assignee": "Tên người phụ trách (hoặc null nếu không xác định được)",
      "dueDate": "Thời hạn hoàn thành nếu có (hoặc null)",
      "priority": "high" // "high" | "medium" | "low"
    }
  ],
  "topics": [
    {
      "title": "Chủ đề thảo luận chính",
      "summary": "Tóm lược nội dung thảo luận",
      "keyPoints": [
        "Chi tiết quan trọng 1",
        "Chi tiết quan trọng 2"
      ]
    }
  ],
  "transcript": [
    {
      "timestamp": "01:25",
      "speaker": "Người nói (nếu nhận diện được) hoặc Speaker 1",
      "text": "Nội dung câu nói hoặc ý kiến then chốt"
    }
  ]
}

Quy tắc:
1. Nếu cuộc họp nói tiếng Việt pha trộn thuật ngữ công nghệ tiếng Anh (Vietglish), hãy giữ nguyên thuật ngữ chuyên ngành chuẩn.
2. Với Action Items, chỉ trích xuất những việc có cam kết thực hiện hoặc giao việc rõ ràng.
3. Không tự bịa thông tin không được đề cập trong file ghi âm.
`;

/**
 * Uploads an audio file to Gemini File API and generates a structured Meeting Recap.
 */
export async function processAudioToRecap(
  options: ProcessAudioOptions,
): Promise<MeetingRecapData> {
  const { filePath, mimeType, displayName, customApiKey, customPrompt } = options;

  if (!fs.existsSync(filePath)) {
    throw new Error(`Audio file not found at path: ${filePath}`);
  }

  const ai = getGeminiClient(customApiKey);

  console.log(`[Gemini] Uploading audio file: ${filePath} (${mimeType})...`);
  let file = await ai.files.upload({
    file: filePath,
    config: {
      mimeType,
      displayName: displayName ?? 'Meeting Audio',
    },
  });

  const fileName = file.name;
  const fileUri = file.uri;
  if (!fileName || !fileUri) {
    throw new Error('Gemini File API did not return valid file metadata (name or uri missing).');
  }

  console.log(`[Gemini] Upload successful. File Name: ${fileName}, State: ${file.state}`);

  // If file is still processing on Google server, wait for it to become ACTIVE
  let pollAttempts = 0;
  while (file.state === 'PROCESSING' && pollAttempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await ai.files.get({ name: fileName });
    pollAttempts++;
    console.log(`[Gemini] File processing status (attempt ${pollAttempts}): ${file.state}`);
  }

  if (file.state === 'FAILED') {
    throw new Error('Gemini File API processing failed for this audio file.');
  }

  try {
    console.log(`[Gemini] Generating recap using model: ${config.geminiModel}...`);
    const prompt = customPrompt?.trim() || DEFAULT_RECAP_PROMPT;

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [
        {
          fileData: {
            fileUri,
            mimeType: file.mimeType ?? mimeType,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini.');
    }

    console.log('[Gemini] Response received. Parsing structured output...');
    const cleanedText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsedData = JSON.parse(cleanedText) as MeetingRecapData;

    // Normalize action items priorities and structure
    parsedData.actionItems = (parsedData.actionItems || []).map((item) => ({
      task: item.task || '',
      assignee: item.assignee || null,
      dueDate: item.dueDate || null,
      priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
      completed: false,
    }));

    parsedData.decisions = parsedData.decisions || [];
    parsedData.topics = parsedData.topics || [];
    parsedData.transcript = parsedData.transcript || [];

    return parsedData;
  } finally {
    // Delete file from Gemini Cloud to free up storage
    if (fileName) {
      try {
        console.log(`[Gemini] Cleaning up remote file: ${fileName}`);
        await ai.files.delete({ name: fileName });
      } catch (delError) {
        console.warn(`[Gemini] Failed to delete remote file ${fileName}:`, delError);
      }
    }
  }
}
