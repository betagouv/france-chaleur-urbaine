import Image from '@/components/ui/Image';
import Tooltip from '@/components/ui/Tooltip';
export function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} étoiles`}>
      {Array.from({ length: value }).map((_, index) => (
        <Image key={index} src="/icons/icon-star.png" alt="" aria-hidden="true" width="20" height="20" />
      ))}

      <Tooltip title="Classement Ademe ENR Choix">
        <sup className="fr-icon-information-fill text-blue before:[--icon-size:1rem] cursor-pointer" />
      </Tooltip>
    </div>
  );
}
