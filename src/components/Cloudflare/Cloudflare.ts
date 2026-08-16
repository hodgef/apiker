import { apiker } from "../Apiker";

export const fetchFromCloudflareAPI = async (endpoint: string, options: RequestInit = {}, method = "GET") => {
  const apiUrl = "https://api.cloudflare.com/client/v4";
 
  if(!apiker.env.CLOUDFLARE_ACCOUNT_ID){
    throw new Error("env.CLOUDFLARE_ACCOUNT_ID is undefined. Please consult the documentation");
  }

  if(!apiker.env.CLOUDFLARE_EMAIL){
    throw new Error("env.CLOUDFLARE_EMAIL is undefined. Please consult the documentation");
  }

  if(!apiker.env.CLOUDFLARE_API_KEY){
    throw new Error("env.CLOUDFLARE_API_KEY is undefined. Please consult the documentation");
  }

  const response = await fetch(`${apiUrl}${endpoint}`, {
    method,
    ...options,
    headers: {
      ...options.headers,
      "X-Auth-Email": apiker.env.CLOUDFLARE_EMAIL,
      "X-Auth-Key": apiker.env.CLOUDFLARE_API_KEY
    },
  });

  return response;
}

/**
 * Fetches the list of object namespaces in account
 */
export const getObjectNamespaces = async (requestOptions = {}) => {
  const result = await fetchFromCloudflareAPI(`/accounts/${apiker.env.CLOUDFLARE_ACCOUNT_ID}/workers/durable_objects/namespaces`, requestOptions);
  const data = await result.json();
  return data;
};

/** Cloudflare pages this listing, and a deployment can hold far more than one page. */
const INSTANCE_PAGE_SIZE = 1000;
const INSTANCE_MAX_PAGES = 20;

/**
 * Fetches the list of instances for a specific object namespace, following the
 * cursor so the result is the whole namespace and not just its first page.
 *
 * @param namespaceId The ID of the object namespace
 */
export const getObjectInstancesByNamespaceId = async (namespaceId: string, requestOptions = {}) => {
  const endpoint = `/accounts/${apiker.env.CLOUDFLARE_ACCOUNT_ID}/workers/durable_objects/namespaces/${namespaceId}/objects`;
  const instances: any[] = [];
  let cursor = "";

  for(let page = 0; page < INSTANCE_MAX_PAGES; page++){
    const query = `?limit=${INSTANCE_PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const result = await fetchFromCloudflareAPI(`${endpoint}${query}`, requestOptions);
    const data = await result.json() as any;

    if(!data?.result){
      return page ? { success: true, result: instances } : data;
    }

    instances.push(...data.result);
    cursor = data.result_info?.cursor || "";

    if(!cursor){
      break;
    }
  }

  return { success: true, result: instances };
}

/**
 * Fetches the list of instances for the object
 * @param appName The name of the application (script). This is the "name" field in app.toml
 * @param objectName The name of the object (class)
 * @param requestOptions Additional options for the request
 */
export const getInstanceList = async (appName: string, objectName: string, requestOptions = {}) => {
  const namespacesResponse = await getObjectNamespaces() as { result: any[] } | undefined;
  const candidates = namespacesResponse?.result?.filter((ns: any) => ns.class === objectName) || [];

  /**
   * `apiker.init({ name })` is a display name and often differs from the worker
   * script, so a single candidate is taken as the match rather than failing.
   */
  const namespace = candidates.find((ns: any) => ns.script === appName)
    || (candidates.length === 1 ? candidates[0] : undefined);
  const namespaceId = namespace?.id;

  if(!namespaceId){
    const scripts = candidates.map((ns: any) => ns.script).join(", ");

    throw new Error(
      scripts
        ? `Object ${objectName} exists on more than one script (${scripts}). Set CLOUDFLARE_SCRIPT_NAME to the right one.`
        : `Namespace for object ${objectName} not found`
    );
  }

  const instanceListResponse = await getObjectInstancesByNamespaceId(namespaceId, requestOptions);
  return instanceListResponse;
};