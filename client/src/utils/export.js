import api from '../api/index.js';

// Скачивает файл через скрытый <a> без открытия новой вкладки
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Запрашивает /api/export/json → скачивает .json файл
export async function exportJson() {
  const response = await api.get('/export/json', { responseType: 'blob' });
  const filename = `medical_data_${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(response.data, filename);
}

// Запрашивает /api/export/pdf → скачивает .pdf файл
export async function exportPdf() {
  const response = await api.get('/export/pdf', { responseType: 'blob' });
  const filename = `medical_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadBlob(response.data, filename);
}
