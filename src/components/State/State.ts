import { MatchResult } from "path-to-regexp";
import { apiker } from "../Apiker";
import { getClientId, getRawIp, getSignedIp } from "../Auth";
import { OBMT } from "../ObjectBase";
import { StateFn, StateMethods } from "./interfaces";

export const getStateMethods = (defaultObjectName: string, matches?: MatchResult<any>) : StateFn =>
  (objectName = defaultObjectName, objectId?) => {
    /**
     * If there's an existing object state mapping, using that as default
     */
    if(!objectId){
      objectId = parseObjectStateMapping(apiker.objectStateMapping[objectName], matches);
    }

    if(apiker.debug){
      console.log('objectId', objectName, apiker.objectStateMapping[objectName], objectId || OBMT.DEFAULT);
    }

    const obj = getEnvObject(objectName, objectId || OBMT.DEFAULT);

    return {
      get: (obj ? getObjectState(obj) : () => {}),
      put: (obj ? putObjectState(obj) : () => {}),
      delete: (obj ? deleteObjectState(obj) : () => {}),
      deleteAll: (obj ? deleteAllObjectState(obj) : () => {}),
      list: (obj ? listObjectState(obj) : () => {}),
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

export const deleteObjectState = (obj: any) =>
  async (propertyName: string) => {
    const result = await obj.fetch("/delete", {
      method: "POST",
      body: JSON.stringify({
        propertyName
      }),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    return JSON.parse(body || null);
  };

export const deleteAllObjectState = (obj: any) =>
  async () => {
    const result = await obj.fetch("/deleteall", {
      method: "POST"
    });

    const body = await result.text();
    return JSON.parse(body || null);
  };

export const getObjectState = (obj: any) =>
  async (propertyName: string) => {
    const result = await obj.fetch("/get", {
      method: "POST",
      body: JSON.stringify({
        propertyName
      }),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    return JSON.parse(body || null);
  };

export const listObjectState = (obj: any) =>
  async (payload: any) => {
    const result = await obj.fetch("/list", {
      method: "POST",
      body: payload ? JSON.stringify(payload) : "",
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    return JSON.parse(body || null);
  };

export const putObjectState = (obj: any) =>
  async (payload: any) => {
    const result = await obj.fetch("/put", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
    });

    const body = await result.text();
    return JSON.parse(body || null);
  };

export const getEnvObject = (objectName: string, objectId: string | undefined) => {
  const id = apiker.env[objectName]?.idFromName(objectId);
  const obj = apiker.env[objectName]?.get(id);
  return obj;
};