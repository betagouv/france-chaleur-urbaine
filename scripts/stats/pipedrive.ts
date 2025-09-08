import { serverConfig } from '@/server/config';
import { fetchJSON } from '@/utils/network';

export async function getDealsCountByStage(stageName: string) {
  if (!serverConfig.PIPEDRIVE_API_KEY || !serverConfig.PIPEDRIVE_BASE_URL) {
    throw new Error('PIPEDRIVE_API_KEY or PIPEDRIVE_BASE_URL is not set');
  }

  const stagesData = await fetchJSON(`${serverConfig.PIPEDRIVE_BASE_URL}/stages?api_token=${serverConfig.PIPEDRIVE_API_KEY}`);
  const stage = stagesData?.data?.find((s: any) => s.name.toLowerCase() === stageName.toLowerCase());
  if (!stage) throw new Error(`Stage '${stageName}' introuvable`);

  const dealsData = await fetchJSON(
    `${serverConfig.PIPEDRIVE_BASE_URL}/deals?stage_id=${stage.id}&status=open&api_token=${serverConfig.PIPEDRIVE_API_KEY}`
  );
  return dealsData?.data?.length ?? 0;
}
