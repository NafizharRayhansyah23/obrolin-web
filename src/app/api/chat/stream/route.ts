import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://127.0.0.1:5000';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { question, category, conversation_id } = body;

    if (!question?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!category) {
      return new Response(
        JSON.stringify({ error: 'Category is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward to FastAPI streaming endpoint
    const response = await fetch(`${RAG_API_URL}/conversations/chat-stream/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id,
        content: question,
        category,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI stream error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to stream from backend' }), 
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Stream proxy error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
