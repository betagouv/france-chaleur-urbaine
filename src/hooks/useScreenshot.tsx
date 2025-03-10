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

const addBackground = (dataUrl: string, { bgColor = 'white', padding = 0 }: { bgColor?: string; padding?: number }): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
};

const useScreenshot = () => {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  const captureNode = async (
    nodeRef: React.RefObject<HTMLElement | null>,
    {
      forPrint = false,
      padding,
      filename = 'impression-ecran.png',
      bgColor = 'white',
    }: { filename?: string; forPrint?: boolean; padding?: number; bgColor?: string } = {}
  ) => {
    setLoading(true);
    setScreenshot(null);

    if (!nodeRef.current) {
      return null;
    }

    const node = nodeRef.current;
    if (!(node instanceof HTMLElement)) {
      return null;
    }

    try {
      const { width: originalWidth, position: originalPosition } = node.style;

      if (forPrint) node.style.width = '794px';

      const dataUrlTransparentBackground = await domtoimage.toPng(node, { filter: (node: any) => node.tagName !== 'BUTTON' });
      const dataUrl = await addBackground(dataUrlTransparentBackground, { bgColor, padding });
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: 'image/png' });

      if (forPrint) node.style.width = originalWidth;
      node.style.position = originalPosition;

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
