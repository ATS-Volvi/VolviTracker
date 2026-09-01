// Export helpers for downloading table data as CSV or JSON.

const triggerDownload = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeCell = (val) => {
  if (val == null) return '';
  const str = String(val);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const exportToCsv = (rows, filename = 'export.csv') => {
  if (!rows || rows.length === 0) {
    triggerDownload('', filename, 'text/csv;charset=utf-8;');
    return;
  }
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(','))
  ];
  triggerDownload(lines.join('\n'), filename, 'text/csv;charset=utf-8;');
};

export const exportToJson = (data, filename = 'export.json') => {
  triggerDownload(JSON.stringify(data, null, 2), filename, 'application/json');
};