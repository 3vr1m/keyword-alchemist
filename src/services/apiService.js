import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async validateAccessKey(accessKey) {
    const response = await this.api.post('/auth/validate', { accessKey });
    return response.data;
  }

  async processKeywords(accessKey, keywords) {
    const response = await this.api.post('/keywords/process', {
      accessKey,
      keywords: keywords.map(k => typeof k === 'string' ? k : k.text)
    });
    return response.data;
  }

  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
