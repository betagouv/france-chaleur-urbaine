import type { Knex } from 'knex';

/**
 * Ajoute des règles d'affectation pour les métropoles / communautés d'agglo existantes
 * en base (tags type "metropole" suffixés par "M").
 *
 * Règle créée : epci.nom:"<NomEpci>" => tag:"<NomEpci>M"
 *
 * Les règles sont listées en dur après vérification des correspondances entre
 * les tags métropole (finissant par M) et les EPCI en base.
 */
export async function up(knex: Knex): Promise<void> {
  const rules = [
    {
      result: 'tag:"AmiensM"',
      search_pattern: 'epci.nom:"CA Amiens Métropole"',
    },
    {
      result: 'tag:"AngersM"',
      search_pattern: 'epci.nom:"CU Angers Loire Métropole"',
    },
    {
      result: 'tag:"BordeauxM"',
      search_pattern: 'epci.nom:"Bordeaux Métropole"',
    },
    {
      result: 'tag:"BrestM"',
      search_pattern: 'epci.nom:"Brest Métropole"',
    },
    {
      result: 'tag:"CaenM"',
      search_pattern: 'epci.nom:"CU Caen la Mer"',
    },
    {
      result: 'tag:"ChartresM"',
      search_pattern: 'epci.nom:"CA Chartres Métropole"',
    },
    {
      result: 'tag:"Clermont-FerrandM"',
      search_pattern: 'epci.nom:"Clermont Auvergne Métropole"',
    },
    {
      result: 'tag:"DijonM"',
      search_pattern: 'epci.nom:"Dijon Métropole"',
    },
    {
      result: 'tag:"GrenobleM"',
      search_pattern: 'epci.nom:"Grenoble-Alpes-Métropole"',
    },
    {
      result: 'tag:"Le HavreM"',
      search_pattern: 'epci.nom:"CU Le Havre Seine Métropole"',
    },
    {
      result: 'tag:"Le MansM"',
      search_pattern: 'epci.nom:"CU Le Mans Métropole"',
    },
    {
      result: 'tag:"LilleM"',
      search_pattern: 'epci.nom:"Métropole Européenne de Lille"',
    },
    {
      result: 'tag:"LimogesM"',
      search_pattern: 'epci.nom:"CU Limoges Métropole"',
    },
    {
      result: 'tag:"LyonM"',
      search_pattern: 'epci.nom:"Métropole de Lyon"',
    },
    {
      result: 'tag:"MetzM"',
      search_pattern: 'epci.nom:"Metz Métropole"',
    },
    {
      result: 'tag:"MontpellierM"',
      search_pattern: 'epci.nom:"Montpellier Méditerranée Métropole"',
    },
    {
      result: 'tag:"NancyM"',
      search_pattern: 'epci.nom:"Métropole du Grand Nancy"',
    },
    {
      result: 'tag:"NantesM"',
      search_pattern: 'epci.nom:"Nantes Métropole"',
    },
    {
      result: 'tag:"NiceM"',
      search_pattern: 'epci.nom:"Métropole Nice Côte d\'Azur"',
    },
    {
      result: 'tag:"OrléansM"',
      search_pattern: 'epci.nom:"Orléans Métropole"',
    },
    {
      result: 'tag:"RennesM"',
      search_pattern: 'epci.nom:"Rennes Métropole"',
    },
    {
      result: 'tag:"RouenM"',
      search_pattern: 'epci.nom:"Métropole Rouen Normandie"',
    },
    {
      result: 'tag:"Saint-EtienneM"',
      search_pattern: 'epci.nom:"Saint-Étienne Métropole"',
    },
    {
      result: 'tag:"StrasbourgM"',
      search_pattern: 'epci.nom:"Eurométropole de Strasbourg"',
    },
    {
      result: 'tag:"ToulonM"',
      search_pattern: 'epci.nom:"Métropole Toulon-Provence-Méditerranée"',
    },
    {
      result: 'tag:"ToulouseM"',
      search_pattern: 'epci.nom:"Toulouse Métropole"',
    },
    {
      result: 'tag:"ToursM"',
      search_pattern: 'epci.nom:"Tours Métropole Val de Loire"',
    },
    {
      result: 'tag:"TroyesM"',
      search_pattern: 'epci.nom:"CA Troyes Champagne Métropole"',
    },
    {
      result: 'tag:"ValenciennesM"',
      search_pattern: 'epci.nom:"CA Valenciennes Métropole"',
    },
  ];

  // Insérer les règles uniquement si elles n'existent pas déjà
  for (const rule of rules) {
    const existingRule = await knex('assignment_rules')
      .where('search_pattern', '=', rule.search_pattern)
      .where('result', '=', rule.result)
      .first();

    if (!existingRule) {
      await knex('assignment_rules').insert({
        ...rule,
        active: true,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Suppression des règles ajoutées par cette migration (basées sur le pattern epci.nom)
  await knex('assignment_rules').where('search_pattern', 'like', 'epci.nom:%').del();
}
