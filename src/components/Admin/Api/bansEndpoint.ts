import { banEntity, getBannedEntries, unbanEntity } from '../../Bans';
import { Handler } from '../../Request';
import { res, res_200, res_400 } from '../../Response';

export const bansEndpoint: Handler = async (params) => {
  const { body, request } = params;
  const { userId } = body || {};

  if(!userId){
    return res_400();
  }

  try {
    if(request.method === "POST"){
      await banEntity(userId);
  
    } else if (request.method === "DELETE") {
      await unbanEntity(userId);
    }
  } catch(e: any) {
    return res_400();
  }

  return res_200();
}

export const searchBansEndpoint: Handler = async (params) => {
  const { matches } = params;
  const userId = matches.params.userId;

  if(!userId){
    return res_400();
  }

  const entries = await getBannedEntries(userId);
  return res({ entries });
}