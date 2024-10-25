import db from 'src/db';

export const getObsoleteUsers = async (): Promise<any[]> => {
  const today = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 6);
  return await db('users')
    .select('email', 'created_at', 'active')
    .whereNull('last_connection')
    .orWhereNotBetween('created_at', [from, today])
    .orderBy('created_at');
};
