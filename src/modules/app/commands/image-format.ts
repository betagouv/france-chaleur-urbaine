import { extname } from 'node:path';

import sharp, { type ResizeOptions } from 'sharp';

import { ObjectKeys, type RequiredFields } from '@/utils/typescript';

const webpQuality = 90;

type ImageFormatConfig = {
  extension: string;
  resize?: RequiredFields<ResizeOptions, 'width'>;
  cropHeight?: number;
};

const configByProfile = {
  infographie: [
    {
      extension: '.webp',
    },
    {
      cropHeight: 370,
      extension: '.preview.webp',
      resize: {
        width: 150,
      },
    },
  ],
} as const satisfies Record<string, ImageFormatConfig[]>;

export const formatProfiles = ObjectKeys(configByProfile);
type FormatProfile = (typeof formatProfiles)[number];

export async function formatImage(inputPath: string, profile: FormatProfile): Promise<void> {
  await Promise.all(
    configByProfile[profile].map(async (config: ImageFormatConfig) => {
      const outputPath = inputPath.replace(extname(inputPath), config.extension);
      let image = sharp(inputPath);

      if (config.resize) {
        image = image.resize(config.resize);

        if (config.cropHeight) {
          const metadata = await image.metadata();
          if (!metadata.width || !metadata.height) {
            throw new Error("Impossible de lire les dimensions de l'image.");
          }
          const aspectRatio = metadata.height / metadata.width;
          const newHeight = Math.round(config.resize.width * aspectRatio);
          if (newHeight > config.cropHeight) {
            image = image.extract({
              height: config.cropHeight,
              left: 0,
              top: 0,
              width: config.resize.width,
            });
          }
        }
      }

      await image.webp({ quality: webpQuality }).toFile(outputPath);
    })
  );
}
