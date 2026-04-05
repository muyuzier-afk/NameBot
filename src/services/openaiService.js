const OpenAI = require('openai');

class OpenAIService {
  constructor(config) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL
    });
  }

  async generateReview(prompt, model = null) {
    const response = await this.client.chat.completions.create({
      model: model || this.config.openai.model,
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  async checkModelAvailability() {
    try {
      const models = await this.client.models.list();
      return models.data.some(model => model.id === this.config.openai.model);
    } catch (error) {
      console.error('Error checking model availability:', error);
      return false;
    }
  }
}

module.exports = OpenAIService;
