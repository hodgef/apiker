export interface PutRequestObject {
    [propertyName: string] : any
}

export interface StateMethods {
    get: (propertyName: string) => any,
    put: (putRequestObject: PutRequestObject) => any,
    delete: (propertyName: string) => any
}