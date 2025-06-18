export interface PutRequestObject {
    [propertyName: string] : any
}

export interface ListRequestObject {
    prefix?: string;
    reverse?: boolean;
    limit?: number | null;
    noCache?: boolean;
}

export type StateFn = (objectName?: string, objectId?: string, isCloudflareObjectId?: boolean) => StateMethods;

export interface StateMethods {
    get: (propertyName: string) => Promise<any>;
    put: (putRequestObject: PutRequestObject) => Promise<any>;
    delete: (propertyName: string | string[]) => Promise<any>;
    deleteAll: () => Promise<any>;
    list: (listRequestObject?: ListRequestObject) => Promise<any>;
}