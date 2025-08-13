import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // Reduce timeout to 10 seconds for faster feedback
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for debugging
    this.api.interceptors.request.use(request => {
      console.log('API Request:', request.method.toUpperCase(), request.url);
      return request;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          code: error.code
        });
        return Promise.reject(error);
      }
    );
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
