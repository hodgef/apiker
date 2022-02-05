import { Handler, RequestParams } from "../Request";
import { Middleware } from "./interfaces";

export const forwardToMiddleware = async (params: RequestParams, handlerFn: Handler, middlewares: Middleware[] = []): Promise<Response> => {
    try {
      const remainingMiddlewares = [...middlewares];
      const loadNextMiddleware = async (): Promise<Response> => {
        const middleware = remainingMiddlewares.shift() as Handler;
        const nextMiddleware = (remainingMiddlewares.shift() || handlerFn) as Handler;
        return middleware ? middleware(params, nextMiddleware) : handlerFn(params);
      };
  
      return loadNextMiddleware();
    } catch(e: any) {
      return new Response(e.message);
    }
};