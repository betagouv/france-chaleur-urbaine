import type { IncomingHttpHeaders } from 'node:http';

/** Première valeur exploitable d'un header potentiellement multi-valué (`a, b` ou tableau). */
function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(',')[0]?.trim() || undefined;
}

/**
 * IP cliente d'une requête. Sur Scalingo, `X-Real-IP` est posé par le routeur d'entrée (fiable) ;
 * `X-Forwarded-For` est falsifiable par le client → pris en second seulement. Fallback sur le socket.
 * Renvoie `undefined` si rien d'exploitable. Validation (`isIP`) à la charge de l'appelant si besoin.
 */
export function getClientIp(req: { headers: IncomingHttpHeaders; socket?: { remoteAddress?: string | null } }): string | undefined {
  return (
    firstHeaderValue(req.headers['x-real-ip']) ?? firstHeaderValue(req.headers['x-forwarded-for']) ?? req.socket?.remoteAddress ?? undefined
  );
}
