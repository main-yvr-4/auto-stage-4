// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://work-1-dvraudrnjvaynftb.prod-runtime.all-hands.dev'
  : 'http://localhost:12000';

export { API_BASE_URL };