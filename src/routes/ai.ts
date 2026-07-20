import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../config/db.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { groq, GROQ_MODEL } from '../services/groq.service.js';

const router = Router();

// GET /api/ai/sessions - List user's chat sessions
router.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const sessions = await db.collection('chatSessions')
      .find({ userId })
      .sort({ updatedAt: -1 })
      .project({ title: 1, updatedAt: 1 }) // Only return metadata
      .toArray();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/ai/sessions/:id - Get a specific chat session with its messages
router.get('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const session = await db.collection('chatSessions').findOne({
      _id: new ObjectId(id),
      userId
    });

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/ai/chat - Streaming AI chat
router.post('/chat', requireAuth, async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  const userId = (req as any).user.id;

  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  try {
    let currentSessionId = sessionId as string | undefined;
    let history: any[] = [];

    if (currentSessionId) {
      const existingSession = await db.collection('chatSessions').findOne({
        _id: new ObjectId(currentSessionId),
        userId
      });
      if (existingSession) {
        history = existingSession.messages || [];
      }
    } else {
      // Create new session
      const result = await db.collection('chatSessions').insertOne({
        userId,
        title: message.substring(0, 30) + '...',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      currentSessionId = result.insertedId.toString();
    }

    // Build the prompt with history
    const systemInstruction = `You are JobSpark's AI Career Coach — a friendly, expert career advisor.
Help users with: resume writing, interview preparation, salary negotiation, job search strategies, and career path planning.
Keep responses practical, concise, and encouraging.
Format your responses in Markdown.`;

    // Build messages including system prompt, history, and user's new message
    const messagesList = [
      { role: 'system' as const, content: systemInstruction },
      ...history.map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Save the user message to DB
    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    await db.collection('chatSessions').updateOne(
      { _id: new ObjectId(currentSessionId as string) },
      { 
        $push: { messages: userMessage } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response from Groq
    const responseStream = await groq.chat.completions.create({
      messages: messagesList,
      model: GROQ_MODEL,
      stream: true,
    });
    let fullAiResponse = '';

    for await (const chunk of responseStream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      fullAiResponse += chunkText;
      // Write chunk to stream, format: data: {"chunk": "..."} \n\n
      res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
    }

    // After stream is done, save AI message to DB
    const aiMessage = { role: 'assistant', content: fullAiResponse, timestamp: new Date().toISOString() };
    await db.collection('chatSessions').updateOne(
      { _id: new ObjectId(currentSessionId as string) },
      { 
        $push: { messages: aiMessage } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Send final message with sessionId
    res.write(`data: ${JSON.stringify({ done: true, sessionId: currentSessionId })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// DELETE /api/ai/sessions/:id - Delete a session
router.delete('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user.id;
    
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const result = await db.collection('chatSessions').deleteOne({ 
      _id: new ObjectId(id),
      userId 
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Session not found or unauthorized' });
      return;
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// POST /api/ai/generate-description - Generate job description
router.post('/generate-description', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, category, requirements } = req.body;

    if (!title || !category || !requirements || !Array.isArray(requirements)) {
      res.status(400).json({ error: 'Title, category, and requirements array are required' });
      return;
    }

    const reqList = requirements.map((r: string) => `- ${r}`).join('\n');
    
    const prompt = `Write a professional job description for: ${title} in the ${category} department.
Requirements:
${reqList}

Include: role overview, responsibilities (5-7 bullets), required skills, nice-to-haves, and what we offer.
Keep it engaging, inclusive, and under 400 words.
Return ONLY the description text, no extra commentary, no markdown code block backticks.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: GROQ_MODEL,
    });
    const text = chatCompletion.choices[0]?.message?.content || '';

    res.json({ description: text });
  } catch (error) {
    console.error('Generate description error:', error);
    res.status(500).json({ error: 'Failed to generate job description' });
  }
});

export default router;
