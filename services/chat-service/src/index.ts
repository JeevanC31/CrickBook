import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4006;

// Ollama host — inside Docker, it points to host machine
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'chat-service' });
});

// POST /chat
app.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // 1. Fetch current database state to provide context to the LLM
    const turfs = await prisma.turf.findMany();
    const coaches = await prisma.coach.findMany();
    const matches = await prisma.match.findMany({
      include: {
        players: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    const lowerMsg = message.toLowerCase();

    // 1.5 Hybrid NLP Routing Interceptor for 100% Accuracy & Zero Latency
    if (/(book|reserve|get|join|list|upcoming|play|roster).*(match|game|tournament|play)/.test(lowerMsg)) {
      res.json({
        intent: 'LIST',
        type: 'MATCH',
        response: "Here are the upcoming matches you can join. Choose one to register and book!",
        matches: matches
      });
      return;
    }

    if (/(book|reserve|get|list|show|court|ground).*(turf|truf|terf|net|pitch)/.test(lowerMsg)) {
      res.json({
        intent: 'LIST',
        type: 'TURF',
        response: "Here are the top-rated turfs available. Select one to book your slot!",
        turfs: turfs
      });
      return;
    }

    if (/(book|find|get|hire|list|show|session|lesson).*(coach|train|lesson|mentor)/.test(lowerMsg)) {
      res.json({
        intent: 'LIST',
        type: 'COACH',
        response: "Here are our elite professional cricket coaches. Book a session to level up your game!",
        coaches: coaches
      });
      return;
    }

    // 2. Build the System Prompt
    const systemPrompt = `
You are the CricBook AI Assistant. You help users find and book cricket turfs, coaches, or join matches.
You must analyze the user's message and determine if they want to book a turf, coach, or match.

Available Data:
Turfs: ${JSON.stringify(turfs)}
Coaches: ${JSON.stringify(coaches)}
Upcoming Matches: ${JSON.stringify(matches)}

If the user wants to book or join a TURF, COACH, or MATCH (e.g. "book a match", "join match", "book turf", "coaches", "list turfs", etc.), you MUST return a LIST intent so they can select and checkout interactively in the UI. Respond in pure JSON format:
{
  "intent": "LIST",
  "type": "MATCH", // or "TURF" or "COACH"
  "response": "Here are the upcoming matches you can join. Choose one to register and book!"
}

If they ask a general question, respond in pure JSON format:
{
  "intent": "ANSWER",
  "response": "Your natural language response here."
}

ALWAYS reply in pure JSON. NEVER use markdown wrapping.
`;

    // 3. Call local Ollama
    let llmResponseText = '';
    try {
      const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2:1b',
          system: systemPrompt,
          prompt: message,
          stream: false,
          format: 'json',
        }),
      });

      if (!ollamaRes.ok) throw new Error('Ollama connection failed');

      const ollamaData: any = await ollamaRes.json();
      llmResponseText = ollamaData.response;
    } catch (e) {
      console.warn('Ollama unavailable, using mock fallback:', e);

      const lowerMsg = message.toLowerCase();

      if (/(book|reserve|get|join).*(match|game|tournament|play)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'LIST', type: 'MATCH', response: "Here are the upcoming matches you can join. Choose one to register and book!" });
      } else if (/(book|reserve|get).*(turf|truf|terf|net|ground|pitch)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'LIST', type: 'TURF', response: "Here are the top-rated turfs available. Select one to book your slot!" });
      } else if (/(book|find|get|hire).*(coach|train|lesson|mentor)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'LIST', type: 'COACH', response: "Here are our elite professional cricket coaches. Book a session to level up your game!" });
      } else if (/(buy|shop|purchase|get).*(bat|ball|pad|glove|equipment|kit)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'ANSWER', response: "I can help you buy cricket gear! Please navigate to the 'Shop' tab on your dashboard to browse our latest equipment." });
      } else if (/(balance|wallet|money|funds|how much)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'ANSWER', response: "You can check your exact wallet balance on your Dashboard. You can also add or withdraw funds from there at any time!" });
      } else if (/^(hi|hello|hey|greetings|morning|evening|afternoon)/.test(lowerMsg)) {
        llmResponseText = JSON.stringify({ intent: 'ANSWER', response: "Hello there! I'm your AI Booking Assistant. I can help you find upcoming matches, book turfs, or find coaches. What can I do for you today?" });
      } else {
        llmResponseText = JSON.stringify({ intent: 'ANSWER', response: "I'm your AI Booking Assistant. Try asking me to 'book a match', 'book a turf', or 'find a coach'!" });
      }
    }

    // 4. Parse the LLM output
    let parsed: any;
    try {
      parsed = JSON.parse(llmResponseText.trim());
    } catch (e) {
      // If parsing fails but it mentions matches/turfs/coaches, guide it
      const lower = llmResponseText.toLowerCase();
      if (lower.includes('match')) {
        parsed = { intent: 'LIST', type: 'MATCH', response: "Here are the upcoming matches you can join:" };
      } else if (lower.includes('turf')) {
        parsed = { intent: 'LIST', type: 'TURF', response: "Here are the turfs available to book:" };
      } else if (lower.includes('coach')) {
        parsed = { intent: 'LIST', type: 'COACH', response: "Here are the coaches you can book sessions with:" };
      } else {
        parsed = { intent: 'ANSWER', response: llmResponseText };
      }
    }

    // 5. Handle List Intents by attaching database objects
    if (parsed.intent === 'LIST') {
      if (parsed.type === 'MATCH') {
        res.json({
          response: parsed.response,
          intent: 'LIST',
          type: 'MATCH',
          matches: matches
        });
        return;
      } else if (parsed.type === 'TURF') {
        res.json({
          response: parsed.response,
          intent: 'LIST',
          type: 'TURF',
          turfs: turfs
        });
        return;
      } else if (parsed.type === 'COACH') {
        res.json({
          response: parsed.response,
          intent: 'LIST',
          type: 'COACH',
          coaches: coaches
        });
        return;
      }
    }

    res.json({ response: parsed.response || "I didn't quite catch that. Can you rephrase?" });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});
