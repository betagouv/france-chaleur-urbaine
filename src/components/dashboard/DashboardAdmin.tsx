import Tile from '@/components/ui/Tile';

export default function DashboardAdmin() {
  return (
    <div className="grid gap-8 grid-cols-2 items-center justify-between mb-5">
      <Tile
        title="Gestion des demandes"
        desc="Gérez les demandes de raccordement à affecter"
        linkProps={{
          href: '/admin/demandes',
        }}
        orientation="horizontal"
        enlargeLinkOrButton
      />
      <Tile
        title="Gestion des utilisateurs"
        desc="Gérez les utilisateurs de l'application"
        linkProps={{
          href: '/admin/users',
        }}
        orientation="horizontal"
        enlargeLinkOrButton
      />
      <Tile
        title="Gestion des réseaux"
        desc="Gérez les réseaux de chaleur et de froid"
        linkProps={{
          href: '/admin/reseaux',
        }}
        orientation="horizontal"
        enlargeLinkOrButton
      />
    </div>
  );
}
