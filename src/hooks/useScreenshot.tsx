import domtoimage from 'dom-to-image';
import React, { useState } from 'react';

import { notify } from '@/services/notification';

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
};

const useScreenshot = ({ forPrint = false }: { forPrint?: boolean } = {}) => {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureNode = async (nodeRef: React.RefObject<null>, filename: string = 'node-capture.png') => {
    setLoading(true);
    setScreenshot(null);

    if (!nodeRef.current) {
      return null;
    }

    const node = nodeRef.current as HTMLElement;
    if (!(node instanceof HTMLElement)) {
      return null;
    }

    try {
      const originalWidth = node.style.width;
      if (forPrint) {
        node.style.width = '794px'; // A4 paper width in pixels
      }

      const dataUrl = await domtoimage.toPng(node, { bgcolor: 'white', filter: (node: any) => node.tagName !== 'BUTTON' });
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: 'image/png' });

      if (forPrint) {
        node.style.width = originalWidth; // Reset the node width to its original state
      }
      setScreenshot(dataUrl);
      setLoading(false);
      notify('none', () => <img src={dataUrl} alt="Screenshot" />, { position: 'bottom-right' });
      return { file, filename };
    } catch (error) {
      console.error('Error capturing image:', error);
      setLoading(false);
      return null;
    }
  };

  const captureNodeAndDownload = async (
    nodeRef: Parameters<typeof captureNode>[0],
    originalFilename?: Parameters<typeof captureNode>[1]
  ) => {
    if (!nodeRef.current) {
      return;
    }

    const { file, filename } = (await captureNode(nodeRef, originalFilename)) || {};
    if (!file || !filename) {
      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    captureNode,
    captureNodeAndDownload,
    screenshot,
    capturing: loading,
  };
};

export default useScreenshot;
