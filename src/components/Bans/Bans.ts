import { getClientId, getCurrentUser } from "../Auth";
import { addLogEntry, deleteAllLogsInObject, deleteLogEntries, getAllLogEntries, getUserLogEntries, getUserLogPropertyName } from "../Logging";
import { OBN } from "../ObjectBase";
import { BANS_PREFIX } from "./constants";

/**
 * Bans an entity
 * @param entity The user's ID (can be any string, but preferable a signedIp acquired through getSignedIp())
 * @param clientId The user's clientId (defaulting to getClientId())
 */
export const banEntity = async (entity: string, clientId = getClientId()) => {
    const user = await getCurrentUser();
    const params = { issuedBy: user?.id, objectId: entity };

    const ban = await addLogEntry(BANS_PREFIX, params, OBN.BANS, entity, clientId);

    /**
     * Bans live in an object of their own per entity, so a copy goes to the
     * default one to keep them listable (`getBannedEntities`).
     */
    await addLogEntry(BANS_PREFIX, { ...params, objectId: undefined }, OBN.BANS, entity, clientId);

    return ban;
};

/**
 * Unbans an entity
 * @param entity The user's ID (can be any string, but preferable a signedIp acquired through getSignedIp())
 */
export const unbanEntity = async (entity: string) => {
    if(!entity){
        return;
    }

    await deleteLogEntries(getUserLogPropertyName(BANS_PREFIX, entity), OBN.BANS);
    return await deleteAllLogsInObject(OBN.BANS, entity)
};

/**
 * Checks whether an entity is banned
 * @param entity The user's ID (can be any string, but preferable a signedIp acquired through getSignedIp())
 */
export const isEntityBanned = async (entity: string) => {
    const entries = await getAllLogEntries(OBN.BANS, 1, entity);
    return entries && !!entries.length;
};

/**
 * Get a list of banned entries for a given entity
 * @param entity The user's ID (can be any string, but preferable a signedIp acquired through getSignedIp())
 * @param limit The number of results to return
 */
export const getBannedEntries = async (entity: string, limit = 10) => {
    const entries = await getAllLogEntries(OBN.BANS, limit, entity);
    return entries;
};

/**
 * Get a list of banned entries (without filtering by entity)
 * @param limit The number of results to return
 */
export const getBannedEntities = async (limit = 10) => {
    const entries = await getAllLogEntries(OBN.BANS, limit);
    return entries;
};
