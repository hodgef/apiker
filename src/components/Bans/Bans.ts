import { getClientId, getCurrentUser } from "../Auth";
import { addLogEntry, deleteUserLogEntries, getAllLogEntries, getUserLogEntries } from "../Logging";
import { OBN } from "../ObjectBase";
import { BANS_PREFIX } from "./constants";

export const banSignedIP = async (signedIp: string, clientId = getClientId()) => {
    const user = await getCurrentUser();
    await addLogEntry(BANS_PREFIX, { issuedBy: user?.id, objectId: signedIp }, OBN.BANS, signedIp, clientId);
};

export const unbanSignedIP = async (signedIp: string) => {
    await deleteUserLogEntries(BANS_PREFIX, OBN.BANS, signedIp);
};

export const isSignedIPBanned = async (signedIp: string) => {
    const entries = await getUserLogEntries(BANS_PREFIX, 1, OBN.BANS, signedIp);
    return entries && entries.length;
};

export const getBannedEntries = async (signedIp: string) => {
    const entries = await getAllLogEntries(OBN.BANS, 10, signedIp);
    return entries;
};

export const getBannedSignedIPs = async (limit = 10) => {
    const entries = await getAllLogEntries(OBN.BANS, limit);
    return entries;
};
