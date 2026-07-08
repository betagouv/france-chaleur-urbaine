import { describe, expect, it } from 'vitest';

import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

import { type DedupeCandidate, type DedupeDeletion, pickDeletions } from './dedupe';

const at = (day: number): Date => new Date(`2025-01-${String(day).padStart(2, '0')}T00:00:00Z`);
const candidate = (id: string, status: string, day: number): DedupeCandidate => ({ created_at: at(day), id, status });

const A_TRAITER = DEMANDE_STATUS.TO_PROCESS;
const RECONTACTE = DEMANDE_STATUS.RECONTACTED;
const NON_REALISABLE = DEMANDE_STATUS.UNREALISABLE;
const REALISE = DEMANDE_STATUS.DONE;

const sortByDeleted = (deletions: DedupeDeletion[]): DedupeDeletion[] =>
  [...deletions].sort((a, b) => a.deletedId.localeCompare(b.deletedId));

describe('pickDeletions()', () => {
  const cases: [label: string, group: DedupeCandidate[], expected: DedupeDeletion[]][] = [
    ["groupe d'une seule demande → rien à supprimer", [candidate('d1', A_TRAITER, 1)], []],
    [
      'aucune traitée → garde la plus récente, supprime le reste',
      [candidate('d1', A_TRAITER, 1), candidate('d2', A_TRAITER, 3), candidate('d3', A_TRAITER, 2)],
      [
        { deletedId: 'd1', keptId: 'd2', reason: 'aucune_traitee' },
        { deletedId: 'd3', keptId: 'd2', reason: 'aucune_traitee' },
      ],
    ],
    [
      'une traitée → supprime les non-traitées, rattachées à la traitée',
      [candidate('d1', A_TRAITER, 1), candidate('d2', RECONTACTE, 2), candidate('d3', A_TRAITER, 3)],
      [
        { deletedId: 'd1', keptId: 'd2', reason: 'non_traitee_vs_traitee' },
        { deletedId: 'd3', keptId: 'd2', reason: 'non_traitee_vs_traitee' },
      ],
    ],
    [
      'plusieurs traitées de même statut → garde la plus récente de ce statut',
      [candidate('d1', RECONTACTE, 1), candidate('d2', NON_REALISABLE, 2), candidate('d3', RECONTACTE, 3)],
      [{ deletedId: 'd1', keptId: 'd3', reason: 'meme_statut' }],
    ],
    ['traitées de statuts distincts → rien à supprimer', [candidate('d1', RECONTACTE, 1), candidate('d2', NON_REALISABLE, 2)], []],
    [
      'cas mixte complet → supprime non-traitées + collapse même statut',
      [
        candidate('d1', A_TRAITER, 1),
        candidate('d2', A_TRAITER, 2),
        candidate('d3', RECONTACTE, 3),
        candidate('d4', REALISE, 4),
        candidate('d5', RECONTACTE, 5),
      ],
      [
        { deletedId: 'd1', keptId: 'd5', reason: 'non_traitee_vs_traitee' },
        { deletedId: 'd2', keptId: 'd5', reason: 'non_traitee_vs_traitee' },
        { deletedId: 'd3', keptId: 'd5', reason: 'meme_statut' },
      ],
    ],
  ];

  it.each(cases)('%s', (_label, group, expected) => {
    expect(sortByDeleted(pickDeletions(group))).toStrictEqual(sortByDeleted(expected));
  });
});
