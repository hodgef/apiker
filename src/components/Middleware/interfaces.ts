import { Handler, RequestParams } from "../Request";

export type Middleware = (params: RequestParams, handlerFn: Handler) => Response | Promise<Response>;