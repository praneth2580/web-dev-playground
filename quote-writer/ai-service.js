/**
 * AI Service for Quote Writer
 * Client-side BYOK with key rotation and robust error handling
 * WARNING: Client-side keys are NOT secure for public apps
 */
class AIService {
    constructor() {
        this.keys = {
            openai: this.loadKeys('qw_openai_key'),
            huggingface: this.loadKeys('qw_hf_key')
        };

        this.models = {
            quote: 'gpt-4o-mini',
            analysis: 'gpt-4o-mini',
            image: 'stabilityai/stable-diffusion-xl-base-1.0'
        };

        this.keyIndices = {
            openai: 0,
            huggingface: 0
        };
    }

    /* -------------------- KEY MANAGEMENT -------------------- */

    loadKeys(storageKey) {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        try {
            if (raw.trim().startsWith('[')) return JSON.parse(raw);
            return [raw.trim()];
        } catch {
            return [raw.trim()];
        }
    }

    saveKeys(openaiKeys = '', hfKeys = '') {
        const parse = (input) =>
            input
                .split(/[\n,]+/)
                .map(k => k.trim())
                .filter(Boolean);

        const openai = parse(openaiKeys);
        const hf = parse(hfKeys);

        if (openai.length) {
            this.keys.openai = openai;
            this.keyIndices.openai = 0;
            localStorage.setItem('qw_openai_key', JSON.stringify(openai));
        }

        if (hf.length) {
            this.keys.huggingface = hf;
            this.keyIndices.huggingface = 0;
            localStorage.setItem('qw_hf_key', JSON.stringify(hf));
        }
    }

    hasKey(type) {
        return type === 'text'
            ? this.keys.openai.length > 0
            : this.keys.huggingface.length > 0;
    }

    getCurrentKey(type) {
        const keys = type === 'text' ? this.keys.openai : this.keys.huggingface;
        const index = type === 'text' ? this.keyIndices.openai : this.keyIndices.huggingface;
        return keys[index % keys.length];
    }

    rotateKey(type) {
        if (type === 'text') {
            this.keyIndices.openai =
                (this.keyIndices.openai + 1) % this.keys.openai.length;
        } else {
            this.keyIndices.huggingface =
                (this.keyIndices.huggingface + 1) % this.keys.huggingface.length;
        }
    }

    /* -------------------- REQUEST WRAPPER -------------------- */

    async makeRotatedRequest(type, fn) {
        const keys = type === 'text' ? this.keys.openai : this.keys.huggingface;
        if (!keys.length) throw new Error(`No ${type} API keys available`);

        let attempts = 0;
        const max = keys.length;

        while (attempts < max) {
            const key = this.getCurrentKey(type);
            try {
                return await fn(key);
            } catch (err) {
                const msg = String(err.message || '');
                const retryable =
                    msg.includes('429') ||
                    msg.includes('quota') ||
                    msg.includes('rate') ||
                    msg.includes('503'); // Retry on service loading

                attempts++;
                if (!retryable || attempts >= max) throw err;

                console.warn(`Attempt ${attempts} failed (${msg}). Rotating key/retrying...`);
                this.rotateKey(type);
                await new Promise(r => setTimeout(r, 2000)); // Longer wait for HF
            }
        }

        throw new Error(`All ${type} API keys exhausted or service unavailable`);
    }

    /* -------------------- UTILITIES -------------------- */

    extractJSON(text) {
        if (!text) throw new Error('Empty AI response');

        const cleaned = text
            .replace(/```json|```/g, '')
            .trim();

        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('Invalid JSON output');
        }

        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }

    /* -------------------- TEXT: QUOTE -------------------- */

    async generateQuote(topic = 'life') {
        if (!this.hasKey('text')) throw new Error('OpenAI API key missing');

        return this.makeRotatedRequest('text', async (key) => {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: this.models.quote,
                    messages: [
                        {
                            role: 'system',
                            content: 'Return ONLY valid JSON: { "quote": "text", "author": "name" }'
                        },
                        {
                            role: 'user',
                            content: `Generate a unique quote about: ${topic}`
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!res.ok) {
                const e = await res.text();
                throw new Error(`OpenAI ${res.status}: ${e}`);
            }

            const data = await res.json();
            const text = data.choices[0].message.content;
            return this.extractJSON(text);
        });
    }

    /* -------------------- TEXT: ANALYSIS -------------------- */

    async analyzeSentimentAndStyle(text) {
        if (!this.hasKey('text')) throw new Error('OpenAI API key missing');

        return this.makeRotatedRequest('text', async (key) => {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: this.models.analysis,
                    messages: [
                        {
                            role: 'user',
                            content: `Analyze this quote:\n"${text}"\n\nReturn ONLY JSON:\n{ "sentiment": "string", "colors": ["#hex","#hex"], "accents": "#hex", "font": "serif|sans-serif|cursive", "animation": "drift|pulse|focus" }`
                        }
                    ],
                    temperature: 0.4
                })
            });

            if (!res.ok) {
                const e = await res.text();
                throw new Error(`OpenAI ${res.status}: ${e}`);
            }

            const data = await res.json();
            return this.extractJSON(data.choices[0].message.content);
        });
    }

    /* -------------------- IMAGE: HUGGINGFACE -------------------- */

    async generateImage(description) {
        if (!this.hasKey('image')) throw new Error('HuggingFace API key missing');

        return this.makeRotatedRequest('image', async (key) => {
            const res = await fetch(
                `https://api-inference.huggingface.co/models/${this.models.image}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json',
                        'x-use-cache': 'false'
                    },
                    body: JSON.stringify({
                        inputs: `aesthetic minimalist wallpaper, ${description}, 4k, high detail, artistic`,
                        options: { wait_for_model: true }
                    })
                }
            );

            if (!res.ok) {
                const e = await res.text();
                throw new Error(`HF ${res.status}: ${e}`);
            }

            const type = res.headers.get('content-type') || '';
            if (!type.startsWith('image/')) {
                const err = await res.text();
                throw new Error(`HF returned non-image: ${err}`);
            }

            return await res.blob();
        });
    }
}

window.AIService = new AIService();
