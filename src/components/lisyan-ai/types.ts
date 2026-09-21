export type ModelId = "lnv1" | "lv1pro" | "lvision";

export interface ModelLimits {
  rpd: string;
  tpd: string;
  tpm: string;
}

export interface ModelInfo {
  id: ModelId;
  name: string;
  tagline: string;
  description: string;
  apiModel: string;
  badge: string;
  vision?: boolean;
  limits: ModelLimits;
  historyDepth: number;
  maxTokens: number;
  temperature: number;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  isImage: boolean;
  dataUrl?: string;
  textContent?: string;
  originalSize?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  modelId?: ModelId;
  streaming?: boolean;
  attachments?: AttachedFile[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  modelId: ModelId;
  createdAt: number;
}
