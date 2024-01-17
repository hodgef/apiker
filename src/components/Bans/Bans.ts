import { getClientId, getCurrentUser } from "../Auth";
import { addLogEntry, deleteAllLogsInObject, getAllLogEntries, getUserLogEntries } from "../Logging";
import { OBN } from "../ObjectBase";
import { BANS_PREFIX } from "./constants";

export const banEntity = async (entity: string, clientId = getClientId()) => {
    const user = await getCurrentUser();
    return await addLogEntry(BANS_PREFIX, { issuedBy: user?.id, objectId: entity }, OBN.BANS, entity, clientId);
};

export const unbanEntity = async (entity: string) => {
    if(!entity){
        return;
    }
    return await deleteAllLogsInObject(OBN.BANS, entity)
};

export const isEntityBanned = async (entity: string) => {
    const entries = await getAllLogEntries(OBN.BANS, 1, entity);
    return entries && entries.length;
};

export const getBannedEntries = async (entity: string) => {
    const entries = await getAllLogEntries(OBN.BANS, 10, entity);
    return entries;
};

export const getBannedEntities = async (limit = 10) => {
    const entries = await getAllLogEntries(OBN.BANS, limit);
    return entries;
};
