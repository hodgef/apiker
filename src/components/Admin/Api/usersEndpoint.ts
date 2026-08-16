import { apiker } from '../../Apiker';
import { findUsers, indexUser, listAdminUsers, listIndexedUsers, User } from '../../Auth';
import { getInstanceList } from '../../Cloudflare';
import { OBN } from '../../ObjectBase';
import { Handler } from '../../Request';
import { res } from '../../Response';

const REQUIRED_ENV = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_EMAIL", "CLOUDFLARE_API_KEY"];

const PAGE_SIZE = 25;

/**
 * Rebuilding reads one object instance per user, and a Worker keeps only a handful
 * of outgoing connections open, so it is done in resumable chunks.
 */
const REBUILD_CHUNK = 25;

/** Never let a stored credential leave the object. */
const withoutSecrets = (user: User) => {
  const { password, ...safe } = user || ({} as User);
  return safe;
};

const readInstance = async (state: any, instanceId: string): Promise<User[]> => {
  try {
    const stored = await state(OBN.USERS, instanceId, true).list({});
    return Object.values(stored || {}) as User[];
  } catch (e) {
    return [];
  }
};

/**
 * Lists the accounts this deployment holds, newest first, or searches them.
 *
 * Reads come from the user directory, so a page costs a fixed number of reads no
 * matter how many accounts exist. Accounts created before the directory existed
 * need `POST /admp/users` once to backfill them.
 *
 * @param q An email, the start of an email, or a user id. Searching returns no cursor.
 * @param role Pass `admin` to list only the accounts that hold admin rights.
 * @param cursor The `cursor` from the previous page.
 * @returns `users` without their stored passwords, and the next `cursor` or `null`.
 */
export const listUsersEndpoint: Handler = async ({ request }) => {
  const search = new URL(request.url).searchParams;
  const query = search.get("q") || "";
  const role = search.get("role") || "";

  if(role === "admin"){
    return res({ users: await listAdminUsers(PAGE_SIZE), cursor: null, role });
  }

  if(query.trim()){
    return res({ users: await findUsers(query, PAGE_SIZE), cursor: null, query: query.trim() });
  }

  const page = await listIndexedUsers({ limit: PAGE_SIZE, cursor: search.get("cursor") || undefined });

  return res({ users: page.users, cursor: page.cursor });
};

/**
 * Backfills the user directory from the Durable Object instances themselves.
 *
 * Only needed for accounts created before the directory existed, and it can be run
 * in chunks: each call reports the `nextOffset` to resume from. Enumerating the
 * instances needs `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL` and
 * `CLOUDFLARE_API_KEY`.
 *
 * @param offset Instance to resume from.
 * @returns How many were `indexed`, the total `instances`, and `nextOffset`.
 */
export const rebuildUserIndexEndpoint: Handler = async ({ state, request }) => {
  const missing = REQUIRED_ENV.filter((key) => !apiker.env?.[key]);

  if(missing.length){
    return res({ available: false, missing, indexed: 0 });
  }

  const offset = Math.max(0, Number(new URL(request.url).searchParams.get("offset")) || 0);
  let instances: { id: string; hasStoredData?: boolean }[] = [];

  try {
    const response = await getInstanceList(apiker.env.CLOUDFLARE_SCRIPT_NAME || apiker.name, OBN.USERS) as any;
    instances = response?.result || [];
  } catch (e: any) {
    return res({ available: false, error: e?.message || "Could not reach the Cloudflare API", indexed: 0 });
  }

  const populated = instances.filter(({ hasStoredData }) => hasStoredData !== false);
  const chunk = populated.slice(offset, offset + REBUILD_CHUNK);
  const found = await Promise.all(chunk.map(({ id }) => readInstance(state, id)));
  const users = found.flat().filter((user) => user?.id && user?.email);

  await Promise.all(users.map((user) => indexUser(user)));

  const readSoFar = offset + chunk.length;

  return res({
    available: true,
    indexed: users.length,
    instances: populated.length,
    read: readSoFar,
    nextOffset: readSoFar < populated.length ? readSoFar : null,
    sample: users.slice(0, 1).map(withoutSecrets)
  });
};
