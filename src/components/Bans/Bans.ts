import { getClientId, getCurrentUser, getSignedIp } from "../Auth";
import { addLogEntry, deleteUserLogEntries, getAllLogEntries, getUserLogEntries } from "../Logging"
import { OBN } from "../ObjectBase"
import { BANS_PREFIX } from "./constants"

export const banSignedIP = async (signedIp = getSignedIp(), clientId = getClientId()) => {
    const user = await getCurrentUser();
    await addLogEntry(BANS_PREFIX, { issuedBy: user?.id}, OBN.BANS, signedIp, clientId);
}

export const unbanSignedIP = async (signedIp = getSignedIp()) => {
    await deleteUserLogEntries(BANS_PREFIX, OBN.BANS, signedIp);
}

export const isSignedIPBanned = async (signedIp = getSignedIp()) => {
    const entries = await getUserLogEntries(BANS_PREFIX, 1, OBN.BANS, signedIp);
    return entries && entries.length;
}

export const getBannedSignedIPs = async (limit = 10) => {
    const entries = await getAllLogEntries(OBN.BANS, limit);
    return entries;
}
