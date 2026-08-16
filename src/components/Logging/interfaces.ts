export interface LogObject {
    propertyName: string;
    time: number;
    id: string;
    clientId: string;
    countryCode: string;
    pathname: string;
    /** Id of the signed-in user the request was made by, if any. */
    userId?: string;
    issuedBy?: string;
}