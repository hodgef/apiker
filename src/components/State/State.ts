import { apiker } from "../Apiker";
import { StateMethods } from "./interfaces";

export const getStateMethods = (defaultObjectName: string) =>
  (objectName = defaultObjectName) => {
    const obj = getEnvObject(objectName);

    return {
      get: (obj ? getObjectState(obj) : () => {}),
      put: (obj ? putObjectState(obj) : () => {}),
      delete: (obj ? deleteObjectState(obj) : () => {}),
      deleteAll: (obj ? deleteAllObjectState(obj) : () => {}),
      list: (obj ? listObjectState(obj) : () => {}),
    } as StateMethods;
  };

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

export const getEnvObject = (objectName) => {
  const id = apiker.env[objectName]?.idFromName(apiker.objectVersion);
  const obj = apiker.env[objectName]?.get(id);
  return obj;
};