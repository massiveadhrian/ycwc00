// ===================================================================
// DHRYZN AI Study Mentor — Vercel Serverless Function (Gemini Proxy)
// ===================================================================
// Proxies Gemini API requests safely using server-side process.env.GEMINI_API_KEY.
// API keys are strictly kept out of client bundles, frontend code, and version control.

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

/**
 * Sanitizes multi-turn conversation contents to ensure strict user/model alternation
 * and valid Gemini API formatting.
 */
function sanitizeContents(contents, fallbackPrompt = '') {
  if (!contents || !Array.isArray(contents) || contents.length === 0) {
    const text = String(fallbackPrompt || 'Hello').trim();
    return [{ role: 'user', parts: [{ text: text || 'Hello' }] }];
  }

  const sanitized = [];
  let lastRole = null;

  for (const item of contents) {
    if (!item) continue;
    const rawRole = (item.role || 'user').toLowerCase();
    const role = (rawRole === 'model' || rawRole === 'ai' || rawRole === 'assistant') ? 'model' : 'user';

    let text = '';
    if (Array.isArray(item.parts) && item.parts.length > 0) {
      const part = item.parts[0];
      text = typeof part === 'string' ? part : (part?.text || '');
    } else if (item.content) {
      text = item.content;
    } else if (item.text) {
      text = item.text;
    }

    const cleanText = String(text || '').trim();
    if (!cleanText) continue;

    if (role === lastRole && sanitized.length > 0) {
      // Merge consecutive turns of the same role
      sanitized[sanitized.length - 1].parts[0].text += '\n\n' + cleanText;
    } else {
      sanitized.push({ role, parts: [{ text: cleanText }] });
      lastRole = role;
    }
  }

  // Ensure first turn is 'user'
  if (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.shift();
  }

  if (sanitized.length === 0) {
    const text = String(fallbackPrompt || 'Hello').trim();
    return [{ role: 'user', parts: [{ text: text || 'Hello' }] }];
  }

  return sanitized;
}

module.exports = async function handler(req, res) {
  // Set CORS and Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();

  // Handle Health / Status Check (GET or action: 'status')
  if (req.method === 'GET' || req.query?.status || req.url?.endsWith('/status')) {
    return res.status(200).json({
      ok: true,
      status: 'online',
      service: 'DHRYZN Gemini Serverless Proxy (Vercel)',
      model: DEFAULT_MODEL,
      proxyActive: true,
      hasKey: Boolean(apiKey && apiKey.length > 10)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: `Method ${req.method} Not Allowed. Use POST.`
    });
  }

  // Parse Request Body safely
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      return res.status(400).json({
        ok: false,
        error: `Invalid JSON payload: ${err.message}`
      });
    }
  }

  // Status check via POST body
  if (body.action === 'status') {
    return res.status(200).json({
      ok: true,
      status: 'online',
      service: 'DHRYZN Gemini Serverless Proxy (Vercel)',
      model: DEFAULT_MODEL,
      proxyActive: true,
      hasKey: Boolean(apiKey && apiKey.length > 10)
    });
  }

  // Validate API Key presence
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: 'GEMINI_API_KEY is not configured in Vercel environment variables.'
    });
  }

  // Extract request parameters
  const {
    prompt,
    systemInstruction,
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    contents,
    jsonMode = false,
    message,
    history
  } = body;

  // Build raw contents depending on chat mode or direct generate mode
  let rawContents = contents;
  let fallbackPrompt = prompt || '';

  if (message !== undefined || Array.isArray(history)) {
    rawContents = [];
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg) continue;
        const role = (msg.role === 'model' || msg.role === 'ai' || msg.role === 'assistant') ? 'model' : 'user';
        const text = (msg.content || msg.text || '').trim();
        if (text) {
          rawContents.push({ role, parts: [{ text }] });
        }
      }
    }
    if (message && String(message).trim()) {
      rawContents.push({ role: 'user', parts: [{ text: String(message).trim() }] });
    }
    fallbackPrompt = message || fallbackPrompt;
  }

  // Sanitize contents for Gemini API specification
  const sanitizedContents = sanitizeContents(rawContents, fallbackPrompt);

  // Determine system instruction
  const effectiveSystemInstruction = systemInstruction || (
    body.action === 'chat' || message !== undefined
      ? "You are DHRYZN, a world-class personal AI Study Mentor powered by Gemini 3.6 Flash. Greet students warmly, explain any academic topic clearly with formatting and emojis, and enthusiastically encourage active learning."
      : null
  );

  // Prepare fallback models queue
  const requestedModel = String(model || DEFAULT_MODEL).replace(/^models\//, '').trim();
  const modelsToTry = [requestedModel];
  for (const m of FALLBACK_MODELS) {
    if (!modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError = null;
  let lastStatus = 500;

  for (const currentModel of modelsToTry) {
    const cleanModel = currentModel.replace(/^models\//, '').trim();
    const geminiPayload = {
      contents: sanitizedContents,
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 2048
      }
    };

    if (jsonMode) {
      geminiPayload.generationConfig.responseMimeType = 'application/json';
    }

    if (effectiveSystemInstruction && typeof effectiveSystemInstruction === 'string' && effectiveSystemInstruction.trim()) {
      geminiPayload.systemInstruction = {
        parts: [{ text: effectiveSystemInstruction.trim() }]
      };
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const respText = await response.text();
      let data;
      try {
        data = JSON.parse(respText);
      } catch {
        data = { raw: respText };
      }

      if (!response.ok) {
        lastStatus = response.status;
        lastError = data?.error?.message || response.statusText || 'Gemini API returned an error';
        // If model not found or rate-limited, try next fallback model
        if (response.status === 404 || response.status === 429 || response.status === 400) {
          continue;
        }
        break;
      }

      const candidate = data.candidates?.[0];
      let generatedText = '';

      if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
        const textParts = candidate.content.parts
          .filter(part => !part.thought && typeof part.text === 'string' && part.text.trim().length > 0)
          .map(part => part.text);

        if (textParts.length > 0) {
          generatedText = textParts.join('\n\n').trim();
        } else {
          generatedText = candidate.content.parts
            .map(part => (typeof part === 'string' ? part : (part?.text || '')))
            .filter(Boolean)
            .join('\n\n')
            .trim();
        }
      }

      if (!generatedText && (!candidate || candidate.finishReason === 'SAFETY')) {
        return res.status(200).json({
          ok: false,
          error: 'Content was blocked or could not be generated due to safety filters.',
          finishReason: candidate?.finishReason
        });
      }

      return res.status(200).json({
        ok: true,
        text: generatedText,
        model: cleanModel,
        usage: data.usageMetadata || {}
      });
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      lastError = isTimeout ? 'Gemini API request timed out (28s).' : (err.message || 'Internal proxy error');
      lastStatus = isTimeout ? 504 : 500;
      continue;
    }
  }

  return res.status(lastStatus || 500).json({
    ok: false,
    error: lastError || 'Gemini API request failed across all candidate models.'
  });
};
