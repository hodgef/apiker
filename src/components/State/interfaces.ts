export interface PutRequestObject {
    [propertyName: string] : any
}

export interface ListRequestObject {
    prefix?: string;
    reverse?: boolean;
    limit?: number;
    noCache?: boolean;
}

export type StateFn = (objectName?: string) => StateMethods;

export interface StateMethods {
    get: (propertyName: string) => any,
    put: (putRequestObject: PutRequestObject) => any,
    delete: (propertyName: string) => any,
    list: (listRequestObject?: ListRequestObject) => any
}