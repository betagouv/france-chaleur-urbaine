import Image from 'next/image';

type CardImageProps = {
  src: string;
  alt: string;
};

/**
 * Fixed-height cover image displayed at the top of a `CardFrame`.
 */
export function CardImage({ src, alt }: CardImageProps) {
  return (
    <div className="relative mb-6 h-45 w-full shrink-0 overflow-hidden rounded-t-lg">
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}
