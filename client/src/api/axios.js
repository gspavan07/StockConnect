import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', // Matches server port
  timeout: 10000,
});

export default api;
