export type ConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  model: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  metadata: MessageMetadata | null;
  created_at: string;
  deleted_at: string | null;
};

export type MessageMetadata = {
  ui_message_id: string;
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  updatedAt: string;
};

export type InsertMessageOptions = {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
};
