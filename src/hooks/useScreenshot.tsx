import domtoimage from 'dom-to-image';
import React, { useState } from 'react';

import { notify } from '@/services/notification';
import { downloadFile } from '@/utils/browser';

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

const useScreenshot = () => {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureNode = async (
    nodeRef: React.RefObject<null>,
    { forPrint = false, padding, filename = 'impression-ecran.png' }: { filename?: string; forPrint?: boolean; padding?: string } = {}
  ) => {
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
      const { width: originalWidth, padding: originalPadding } = node.style;

      if (forPrint) node.style.width = '794px'; // A4 paper width in pixels
      if (padding) node.style.padding = padding;

      const dataUrl = await domtoimage.toPng(node, { bgcolor: 'white', filter: (node: any) => node.tagName !== 'BUTTON' });
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: 'image/png' });

      if (forPrint) node.style.width = originalWidth;
      if (padding) node.style.padding = originalPadding;

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

  const captureNodeAndDownload = async (nodeRef: Parameters<typeof captureNode>[0], options?: Parameters<typeof captureNode>[1]) => {
    if (!nodeRef.current) {
      return;
    }

    const { file, filename } = (await captureNode(nodeRef, options)) || {};
    if (!file || !filename) {
      return;
    }
    const url = URL.createObjectURL(file);
    downloadFile(url, filename);
  };

  return {
    captureNode,
    captureNodeAndDownload,
    screenshot,
    capturing: loading,
  };
};

export default useScreenshot;
