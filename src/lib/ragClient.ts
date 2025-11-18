// Helper client to call the external RAG FastAPI service
// Provides small wrappers for creating conversations and sending chat messages
const RAG_API_URL = process.env.RAG_API_URL || 'http://localhost:5000';

type CreateConversationResp = {
  conversation_id: string;
  created_at?: string;
};

type ChatResp = {
  response: string;
  conversation_id: string;
  timestamp?: string;
  success?: boolean;
};

async function handleJsonResponse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(text || res.statusText);
  }
}

export async function createConversation(): Promise<CreateConversationResp> {
  const res = await fetch(`${RAG_API_URL}/conversations/create/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createConversation failed: ${res.status} ${body}`);
  }
  return handleJsonResponse(res) as Promise<CreateConversationResp>;
}

export async function chatWithRag(
  conversation_id: string,
  content: string,
  category?: string
): Promise<ChatResp> {
  const res = await fetch(`${RAG_API_URL}/conversations/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id, content, category }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`chatWithRag failed: ${res.status} ${body}`);
  }
  return handleJsonResponse(res) as Promise<ChatResp>;
}

export default {
  createConversation,
  chatWithRag,
};
