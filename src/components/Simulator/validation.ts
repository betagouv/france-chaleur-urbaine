import z from 'zod';

export const simulatorSchema = z.object({
  mode_pro: z.boolean().optional(),
  // departement: z.string({ required_error: 'Le département est obligatoire.' }),
  // commune: z.string({ required_error: 'Le département est obligatoire.' }),
  dpe: z.string().optional(),
  description: z.string().optional(),
  services_supplementaires: z.array(z.string()).optional(),
  departement: z.string({ required_error: 'Le département est obligatoire.' }),
  commune: z.string({ required_error: 'La commune est obligatoire.' }),
  terms: z.boolean({ required_error: "Vous devez accepter les conditions d'utilisation" }).refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation",
  }),
  adresse: z
    .string({ required_error: 'L’adresse est obligatoire.' })
    .min(1, { message: 'Champ obligatoire' })
    .max(5, { message: 'moins que 5' }),
  type_batiment: z.enum(['residentiel', 'tertiaire'], {
    required_error: 'Le type de bâtiment est obligatoire.',
  }),
});

export const publicodesSimulatorSchema = z.object({
  taille: z.string().optional(),
  poids: z.string().optional(),
});

export type SimulatorSchemaType = z.infer<typeof simulatorSchema>;
export type PublicodeSimulatorSchemaType = z.infer<typeof publicodesSimulatorSchema>;