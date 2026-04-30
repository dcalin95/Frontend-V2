/**
 * OpenAI Model - LLM signal/levels output (frontend).
 * Integrare cu OpenAI API (GPT-4 Turbo):
 * - LLM produce signal, levels (entry/SL/TP), reasoning. Nu este validated analysis.
 * - Scorul returnat este heuristic decision score; nu este probabilitate calibrată.
 * @module OpenAIModel
 */

// Import OpenAI SDK (sau folosește fetch API dacă SDK nu e disponibil în frontend)
let OpenAI;
try {
  // Încearcă să importe OpenAI SDK (dacă e disponibil în frontend)
  OpenAI = require('openai');
} catch (e) {
  // Fallback la fetch API pentru frontend
  OpenAI = null;
}

export class OpenAIModel {
  constructor(config) {
    if (!config || !config.enabled) {
      throw new Error('OpenAIModel: OpenAI config is required and must be enabled');
    }

    if (!config.apiKey) {
      throw new Error('OpenAIModel: OpenAI API key is required');
    }

    this.config = {
      enabled: config.enabled,
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      temperature: config.temperature || 0.3,
      maxTokens: config.maxTokens || 500,
      baseURL: config.baseURL || 'https://api.openai.com/v1'
    };

    // Initialize OpenAI client (dacă SDK e disponibil)
    if (OpenAI && typeof OpenAI === 'function') {
      try {
        this.client = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL
        });
        this.useSDK = true;
      } catch (error) {
        console.warn('OpenAIModel: Failed to initialize OpenAI SDK, falling back to fetch API', error);
        this.useSDK = false;
      }
    } else {
      this.useSDK = false;
    }

    // Rate limiting tracking
    this.rateLimit = {
      requests: [],
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 500
    };
  }

  /**
   * Analizează market conditions folosind OpenAI API
   * @param {Object} params - { token, originalToken, marketData, context, isBitcoin, strategies }
   * @returns {Promise<Object>} LLM output: signal, heuristic decision score, reasoning, entry/SL/TP. Not validated analysis.
   */
  async analyze({ token, originalToken, marketData, context, isBitcoin, strategies = [] }) {
    if (!this.config.enabled) {
      throw new Error('OpenAIModel: OpenAI is not enabled');
    }

    // Check rate limiting
    this.checkRateLimit();

    try {
      // Build prompt pentru trading analysis (folosește originalToken dacă există pentru Bitcoin tokens)
      const tokenToUse = originalToken || token;
      const strategiesToUse = strategies.length > 0 ? strategies : (context?.strategies || []);
      const prompt = this.buildPrompt(tokenToUse, marketData, strategiesToUse, isBitcoin);

      // Call OpenAI API
      let response;
      if (this.useSDK && this.client) {
        // Use OpenAI SDK
        response = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          response_format: { type: 'json_object' } // Force JSON response
        });

        // Track rate limit
        this.trackRateLimit();
      } else {
        // Use fetch API (fallback pentru frontend)
        response = await this.callOpenAIAPI(prompt);
        this.trackRateLimit();
      }

      // Parse response
      const analysis = this.parseResponse(response);

      return {
        signal: analysis.signal || 'hold',
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || '',
        entryPrice: analysis.entryPrice || null,
        stopLoss: analysis.stopLoss || null,
        takeProfit: analysis.takeProfit || null
      };
    } catch (error) {
      console.error('OpenAIModel.analyze error:', error);

      // Handle specific OpenAI errors
      const errorMessage = error.message || '';
      const errorLower = errorMessage.toLowerCase();

      // Rate limit errors
      if (error.response?.status === 429 || errorLower.includes('rate limit') || errorLower.includes('429')) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a few minutes before trying again. If this persists, check your OpenAI API quota.');
      }

      // Authentication errors
      if (error.response?.status === 401 || errorLower.includes('invalid api key') || errorLower.includes('401') || errorLower.includes('unauthorized')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your API key configuration in settings.');
      }

      // Server errors
      if (error.response?.status === 500 || errorLower.includes('500') || errorLower.includes('server error')) {
        throw new Error('OpenAI API server error. The service may be temporarily unavailable. Please try again in a few moments.');
      }

      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch') || errorLower.includes('connection')) {
        throw new Error('Network error connecting to OpenAI API. Please check your internet connection and try again.');
      }

      // Parse errors
      if (errorLower.includes('parse') || errorLower.includes('json')) {
        throw new Error('Failed to parse OpenAI response. The API may have returned an unexpected format. Please try again.');
      }

      // Fallback response with improved message
      const friendlyMessage = errorMessage || 'Unknown error during OpenAI analysis';
      return {
        signal: 'hold',
        confidence: 0.0,
        reasoning: `Analysis unavailable: ${friendlyMessage}. Please check your OpenAI API configuration or try again later.`,
        entryPrice: null,
        stopLoss: null,
        takeProfit: null
      };
    }
  }

  /**
   * Build prompt pentru trading analysis
   * @private
   */
  buildPrompt(token, marketData, strategies, isBitcoin = false) {
    const tokenInfo = token ? `Token: ${typeof token === 'string' ? token : (token.symbol || token.address || 'Unknown')}` : 'Token: Not specified';
    const bitcoinNote = isBitcoin ? ' (Bitcoin token pe BSC)' : '';
    const price = marketData?.price || 'N/A';
    const volume24h = marketData?.volume24h || 'N/A';
    const change24h = marketData?.change24h || 'N/A';
    const volatility = marketData?.volatility || 'N/A';
    const strategiesList = strategies.length > 0 ? strategies.join(', ') : 'No specific strategies';

    return `Ești un expert AI Trading Bot pentru BitSwapDEX pe Binance Smart Chain (BSC).

${tokenInfo}${bitcoinNote}
Preț actual: ${price}
Volume 24h: ${volume24h}
Schimbare 24h: ${change24h}%
Volatilitate: ${volatility}
Strategii active: ${strategiesList}

Analizează condițiile de piață și generează un trading signal.

Răspunde în format JSON cu următoarele câmpuri:
{
  "signal": "buy" | "sell" | "hold" | "swap",
  "confidence": 0.0-1.0 (încredere în signal),
  "reasoning": "explicație scurtă pentru decizie",
  "entryPrice": preț recomandat de intrare (număr sau null),
  "stopLoss": preț stop loss recomandat (număr sau null),
  "takeProfit": preț take profit recomandat (număr sau null)
}

Reguli:
- "buy": recomandă cumpărare când există oportunități pozitive
- "sell": recomandă vânzare când prețul este supraevaluat sau trend negativ
- "hold": menține poziția când nu există semnale clare
- "swap": recomandă swap când există oportunități de arbitraj
- confidence: 0.0-1.0 (mai mare = mai sigur)
- entryPrice: preț recomandat pentru trade (dacă signal != "hold")
- stopLoss: preț stop loss pentru limitarea pierderilor (dacă signal != "hold")
- takeProfit: preț take profit pentru profit target (dacă signal != "hold")`;
  }

  /**
   * Get system prompt pentru OpenAI
   * @private
   */
  getSystemPrompt() {
    return `You are an expert AI Trading Bot for BitSwapDEX on Binance Smart Chain (BSC).

Your role:
- Analyze market conditions and generate trading signals
- Provide confidence scores for your recommendations
- Suggest entry prices, stop loss, and take profit levels
- Explain your reasoning clearly and concisely

Always respond in valid JSON format as specified in user prompts.`;
  }

  /**
   * Call OpenAI API using fetch (fallback pentru frontend)
   * @private
   */
  async callOpenAIAPI(prompt) {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: { message: response.statusText || 'Unknown error' } };
      }

      const status = response.status;
      const errorMsg = errorData.error?.message || response.statusText || 'Unknown error';

      // Provide specific error messages based on status code
      if (status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a few minutes before trying again.');
      } else if (status === 401) {
        throw new Error('OpenAI API key is invalid or missing. Please check your API key configuration.');
      } else if (status === 500 || status === 502 || status === 503) {
        throw new Error('OpenAI API server error. The service may be temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`OpenAI API error (${status}): ${errorMsg}`);
      }
    }

    const data = await response.json();
    return data;
  }

  /**
   * Parse OpenAI response (JSON)
   * @private
   */
  parseResponse(response) {
    try {
      let content;
      
      if (this.useSDK && response.choices && response.choices[0]) {
        // OpenAI SDK format
        content = response.choices[0].message.content;
      } else if (response.choices && response.choices[0]) {
        // Fetch API format (similar)
        content = response.choices[0].message.content;
      } else {
        throw new Error('Invalid OpenAI response format');
      }

      // Parse JSON content
      const parsed = JSON.parse(content);

      // Validate și normalize response
      return {
        signal: this.validateSignal(parsed.signal) ? parsed.signal : 'hold',
        confidence: this.validateConfidence(parsed.confidence) ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
        entryPrice: this.validatePrice(parsed.entryPrice) ? parseFloat(parsed.entryPrice) : null,
        stopLoss: this.validatePrice(parsed.stopLoss) ? parseFloat(parsed.stopLoss) : null,
        takeProfit: this.validatePrice(parsed.takeProfit) ? parseFloat(parsed.takeProfit) : null
      };
    } catch (error) {
      console.error('OpenAIModel.parseResponse error:', error);
      
      // Fallback la default values
      return {
        signal: 'hold',
        confidence: 0.5,
        reasoning: `Parse error: ${error.message}`,
        entryPrice: null,
        stopLoss: null,
        takeProfit: null
      };
    }
  }

  /**
   * Validate signal value
   * @private
   */
  validateSignal(signal) {
    return ['buy', 'sell', 'hold', 'swap'].includes(signal);
  }

  /**
   * Validate confidence value
   * @private
   */
  validateConfidence(confidence) {
    return typeof confidence === 'number' && !isNaN(confidence) && confidence >= 0 && confidence <= 1;
  }

  /**
   * Validate price value
   * @private
   */
  validatePrice(price) {
    if (price === null || price === undefined) return true;
    return typeof price === 'number' && !isNaN(price) && price > 0;
  }

  /**
   * Check rate limiting
   * @private
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old requests
    this.rateLimit.requests = this.rateLimit.requests.filter(timestamp => timestamp > oneHourAgo);

    // Check per minute limit
    const requestsLastMinute = this.rateLimit.requests.filter(timestamp => timestamp > oneMinuteAgo).length;
    if (requestsLastMinute >= this.rateLimit.maxRequestsPerMinute) {
      throw new Error(`OpenAI API rate limit exceeded: ${requestsLastMinute} requests in the last minute (max: ${this.rateLimit.maxRequestsPerMinute})`);
    }

    // Check per hour limit
    const requestsLastHour = this.rateLimit.requests.length;
    if (requestsLastHour >= this.rateLimit.maxRequestsPerHour) {
      throw new Error(`OpenAI API rate limit exceeded: ${requestsLastHour} requests in the last hour (max: ${this.rateLimit.maxRequestsPerHour})`);
    }
  }

  /**
   * Track rate limiting
   * @private
   */
  trackRateLimit() {
    this.rateLimit.requests.push(Date.now());
  }
}
