import { getLogEntries } from '../../Logging';
import { Handler } from '../../Request';
import { res, res_400 } from '../../Response';

export const searchLogsEndpoint: Handler = async (params) => {
  const { request } = params;
  const url = new URL(request.url);
  const search = new URLSearchParams(url.search);
  const logId = search.get("logId") || "";

  if(!logId){
    return res_400();
  }

  const entries = await getLogEntries(logId, 100);
  return res({ entries });
}