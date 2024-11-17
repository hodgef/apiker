import { MatchResult } from "path-to-regexp";
import { apiker } from "../Apiker";
import { getClientId, getRawIp, getSignedIp } from "../Auth";
import { OB_ENDPOINT, OBMT } from "../ObjectBase";
import { StateFn, StateMethods } from "./interfaces";

export const getStateMethods = (defaultObjectName: string, matches?: MatchResult<any>) : StateFn =>
  (objectName = defaultObjectName, objectId?) => {
    /**
     * If there's an existing object state mapping, using that as default
     */
    if(!objectId){
      objectId = parseObjectStateMapping(apiker.objectStateMapping[objectName], matches) || OBMT.DEFAULT;
    }

    const obj = getEnvObject(objectName, objectId);

    const callback = (operationName: string) => {
      if(apiker.debug){
        console.log("APIKER ::", operationName, objectName, objectId);
      }
    }

    return {
      get: (obj ? getObjectState(obj, () => callback("get")) : () => {}),
      put: (obj ? putObjectState(obj, () => callback("put")) : () => {}),
      delete: (obj ? deleteObjectState(obj, () => callback("delete")): () => {}),
      deleteAll: (obj ? deleteAllObjectState(obj, () => callback("deleteAll")) : () => {}),
      list: (obj ? listObjectState(obj, () => callback("list")) : () => {}),
    } as StateMethods;
  };

export const parseObjectStateMapping = (objectStateMapping: string, matches?: MatchResult<any>) => {
  let value = objectStateMapping;

  if(objectStateMapping === OBMT.SIGNEDIP){
    value = getSignedIp();

  } else if(objectStateMapping === OBMT.CLIENTID){
    value = getClientId();

  } else if(objectStateMapping === OBMT.IP) {
    value = getRawIp();

  } else if (!!objectStateMapping){
    // If the mapping still hasn't been matched, matching it with one of the route parameters 
    value = matches?.params[objectStateMapping] || objectStateMapping;
  }

  /**
   * Adding mapping to headers for debug purposes
   */
  if(apiker.debug){
    console.log("objectStateMapping", objectStateMapping);
    console.log("StateMappingValue", value);
  }

  return value;
}

export const deleteObjectState = (obj: any, callback: any) =>
  async (propertyName: string) => {
    const result = await obj.fetch(OB_ENDPOINT + "/delete", {
      method: "POST",
      body: JSON.stringify({
        propertyName
      }),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    const parsedBody = JSON.parse(body || null);

    if(callback){
      callback();
    }

    if(apiker.debug){
      console.log('deleteObjectState', propertyName, parsedBody);
    }

    return parsedBody;
  };

export const deleteAllObjectState = (obj: any, callback: any) =>
  async () => {
    const result = await obj.fetch(OB_ENDPOINT + "/deleteall", {
      method: "POST"
    });

    const body = await result.text();
    const parsedBody = JSON.parse(body || null);

    if(callback){
      callback();
    }

    if(apiker.debug){
      console.log('deleteAllObjectState', parsedBody);
    }

    return parsedBody;
  };

export const getObjectState = (obj: any, callback: any) =>
  async (propertyName: string) => {
    const result = await obj.fetch(OB_ENDPOINT + "/get", {
      method: "POST",
      body: JSON.stringify({
        propertyName
      }),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    const parsedBody = JSON.parse(body || null);

    if(callback){
      callback();
    }

    if(apiker.debug){
      console.log('getObjectState', propertyName, parsedBody);
    }

    return parsedBody;
  };

export const listObjectState = (obj: any, callback: any) =>
  async (payload: any) => {
    const result = await obj.fetch(OB_ENDPOINT + "/list", {
      method: "POST",
      body: payload ? JSON.stringify(payload) : "",
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    const parsedBody = JSON.parse(body || null);

    if(callback){
      callback();
    }

    if(apiker.debug && !payload?.prefix?.includes("firewall")){
      console.log('listObjectState', payload, parsedBody);
    }

    return parsedBody;
  };

export const putObjectState = (obj: any, callback: any) =>
  async (payload: any) => {
    const result = await obj.fetch(OB_ENDPOINT + "/put", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    const parsedBody = JSON.parse(body || null);

    if(callback){
      callback();
    }

    if(apiker.debug){
      console.log('putObjectState', payload, parsedBody);
    }

    return JSON.parse(body || null);
  };

export const getEnvObject = (objectName: string, objectId: string | undefined) => {
  const id = apiker.env[objectName]?.idFromName(objectId);
  const obj = apiker.env[objectName]?.get(id);
  return obj;
};