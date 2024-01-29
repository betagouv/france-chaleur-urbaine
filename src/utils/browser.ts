/**
 * Make the browser download a stringobject.
 */
export function downloadObject(object: any, filename: string, type: string) {
  const blob = new Blob([JSON.stringify(object)], {
    type,
  });
  downloadFile(URL.createObjectURL(blob), filename);
}

/**
 * Make the browser download a URL.
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  document.body.appendChild(link);
  link.type = 'hidden';
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
