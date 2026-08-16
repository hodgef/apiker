import { apiker } from "../../Apiker";
import { OBN } from "../../ObjectBase";
import { User } from "./interfaces";

/**
 * A listable directory of users.
 *
 * Users are stored one Durable Object instance per id, which makes them
 * unlistable: enumerating them costs one read per user. This keeps a compact
 * index alongside them so a page costs a fixed number of reads no matter how many
 * accounts exist.
 *
 * The index lives in reserved instances of the existing `Users` object, so no new
 * Durable Object class (and no migration) is needed. Entries are spread over a few
 * shards to avoid funnelling every registration through a single instance, and are
 * keyed by creation time so a page can be read newest-first.
 */

const INDEX_PREFIX = "user:";
const EMAIL_PREFIX = "email:";
const SHARD_COUNT = 8;
const TIME_KEY_LENGTH = 16;

/** Reserved instance names; user ids are hex hashes, so they never collide. */
const shardInstance = (shard: number) => `_userindex:${shard}`;

/**
 * Emails are grouped by their first character so a "starts with" search reads a
 * single instance instead of every shard.
 */
const emailInstance = (email = "") => `_useremail:${(email[0] || "_").toLowerCase()}`;

const shardFor = (id = "") => {
  const value = parseInt(id.slice(0, 2), 16);
  return Number.isNaN(value) ? 0 : value % SHARD_COUNT;
};

const indexKey = ({ id, createdAt }: Partial<User>) =>
  `${INDEX_PREFIX}${String(createdAt || 0).padStart(TIME_KEY_LENGTH, "0")}:${id}`;

const emailKey = (email = "") => `${EMAIL_PREFIX}${email.toLowerCase()}`;

export interface DirectoryEntry {
  id: string;
  email: string;
  role?: string;
  verified?: boolean;
  createdAt?: number;
}

const toEntry = ({ id, email, role, verified, createdAt }: User): DirectoryEntry =>
  ({ id, email, role, verified, createdAt });

/**
 * Adds a user to the directory. Safe to call repeatedly for the same user.
 *
 * @param user The stored user record.
 */
export const indexUser = async (user: User) => {
  if(!user?.id || !apiker.objects?.includes(OBN.USERS)){
    return false;
  }

  const { state } = apiker.requestParams;
  const entry = toEntry(user);

  await state(OBN.USERS, shardInstance(shardFor(user.id))).put({ [indexKey(user)]: entry });

  if(user.email){
    await state(OBN.USERS, emailInstance(user.email)).put({ [emailKey(user.email)]: entry });
  }

  return true;
};

/**
 * Removes a user from the directory.
 *
 * @param user The stored user record, whose creation time and email locate the entries.
 */
export const unindexUser = async (user: Partial<User>) => {
  if(!user?.id || !apiker.objects?.includes(OBN.USERS)){
    return false;
  }

  const { state } = apiker.requestParams;
  await state(OBN.USERS, shardInstance(shardFor(user.id))).delete(indexKey(user));

  if(user.email){
    await state(OBN.USERS, emailInstance(user.email)).delete(emailKey(user.email));
  }

  return true;
};

/** A user id is the hex hash `randomHash_SHA1` produces. */
const looksLikeId = (query: string) => /^[a-f0-9]{16,40}$/i.test(query);

/**
 * Lists the accounts that hold admin rights, newest first.
 *
 * `adminIds` is the authoritative list, so this reads it and then one instance per
 * admin — no directory scan, and no chance of a stale `role` field disagreeing with
 * who can actually sign in.
 *
 * @param limit How many admins to return.
 */
export const listAdminUsers = async (limit = 25): Promise<DirectoryEntry[]> => {
  if(!apiker.objects?.includes(OBN.USERS)){
    return [];
  }

  const { state } = apiker.requestParams;
  const adminIds = (await state(OBN.COMMON).get("adminIds")) || [];

  const found = await Promise.all(
    (adminIds as string[]).slice(0, limit).map(async (id) => {
      try {
        return await state(OBN.USERS, id).get(id) as User;
      } catch (e) {
        return undefined;
      }
    })
  );

  return found
    .filter((user) => user?.id)
    .map((user) => toEntry(user as User))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

/**
 * Finds users whose email starts with the query, or the single user with that id.
 *
 * Reads one instance, so the cost does not grow with the number of accounts. It is
 * a prefix search rather than a substring one for that reason.
 *
 * @param query An email, the start of an email, or a user id.
 * @param limit How many users to return.
 */
export const findUsers = async (query = "", limit = 25): Promise<DirectoryEntry[]> => {
  const term = query.trim().toLowerCase();

  if(!term || !apiker.objects?.includes(OBN.USERS)){
    return [];
  }

  const { state } = apiker.requestParams;

  if(looksLikeId(term)){
    const stored = await state(OBN.USERS, term).get(term) as User;
    return stored?.id ? [toEntry(stored)] : [];
  }

  const found = await state(OBN.USERS, emailInstance(term)).list({
    prefix: emailKey(term),
    limit
  });

  return Object.values(found || {}) as DirectoryEntry[];
};

/**
 * Reads a page of the directory, newest first.
 *
 * Cost is one read per shard, independent of how many accounts exist.
 *
 * @param limit How many users to return.
 * @param cursor The `cursor` from the previous page.
 * @returns The page of users and the `cursor` to continue from, or `null` at the end.
 */
export const listIndexedUsers = async ({ limit = 25, cursor }: { limit?: number; cursor?: string } = {}) => {
  if(!apiker.objects?.includes(OBN.USERS)){
    return { users: [] as DirectoryEntry[], cursor: null };
  }

  const { state } = apiker.requestParams;
  const payload: any = { prefix: INDEX_PREFIX, reverse: true, limit };

  if(cursor){
    payload.end = cursor;
  }

  const shards = await Promise.all(
    Array.from({ length: SHARD_COUNT }, (_, shard) => state(OBN.USERS, shardInstance(shard)).list(payload))
  );

  const entries: [string, DirectoryEntry][] = [];
  shards.forEach((stored) => entries.push(...(Object.entries(stored || {}) as [string, DirectoryEntry][])));

  const page = entries.sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0)).slice(0, limit);

  return {
    users: page.map(([, entry]) => entry),
    cursor: page.length === limit ? page[page.length - 1][0] : null
  };
};
