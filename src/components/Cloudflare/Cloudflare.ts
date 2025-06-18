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

/**
 * Fetches the list of instances for a specific object namespace
 * @param namespaceId The ID of the object namespace
 */
export const getObjectInstancesByNamespaceId = async (namespaceId: string, requestOptions = {}) => {
  const result = await fetchFromCloudflareAPI(`/accounts/${apiker.env.CLOUDFLARE_ACCOUNT_ID}/workers/durable_objects/namespaces/${namespaceId}/objects`, requestOptions);
  const data = await result.json();
  return data;
}

/**
 * Fetches the list of instances for the object
 */
export const getInstanceList = async (objectName: string, requestOptions = {}) => {
  const namespacesResponse = await getObjectNamespaces() as { result: any[] } | undefined;
  const namespace = namespacesResponse?.result?.find((ns: any) => ns.class === objectName);
  const namespaceId = namespace?.id;

  if(!namespaceId){
    throw new Error(`Namespace for object ${objectName} not found`);
  }

  const instanceListResponse = await getObjectInstancesByNamespaceId(namespaceId, requestOptions);
  return instanceListResponse;
};