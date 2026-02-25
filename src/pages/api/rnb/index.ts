import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const banId = String(req.query.banId ?? '');
  if (!banId) return res.status(400).json({ error: 'banId manquant' });

  const url = `https://rnb-api.beta.gouv.fr/api/alpha/buildings/address/?cle_interop_ban=${encodeURIComponent(banId)}`;

  try {
    const r = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
    });

    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).send(text);
    }

    res.setHeader('Content-Type', r.headers.get('content-type') ?? 'application/json');
    return res.status(200).send(text);
  } catch (e: any) {
    return res.status(500).json({ error: "Erreur lors de l'appel au RNB", message: e?.message ?? String(e) });
  }
}
