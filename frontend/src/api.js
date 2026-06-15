import axios from 'axios';

const API = axios.create({ baseURL: '/api', timeout: 120000 });

export async function evaluateManual(questions, evaluationMode) {
  const res = await API.post('/evaluate/manual', { questions, evaluation_mode: evaluationMode });
  return res.data;
}

export async function evaluateFile(formData) {
  const res = await API.post('/evaluate/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });
  return res.data;
}

export async function checkHealth() {
  const res = await API.get('/health');
  return res.data;
}

export async function getModelStatus() {
  const res = await API.get('/model-status');
  return res.data;
}
