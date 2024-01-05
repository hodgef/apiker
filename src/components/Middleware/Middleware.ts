import { RequestParams } from "../Request";
import { res_204 } from "../Response";
import { Middleware } from "./interfaces";

export const forwardToMiddleware = async (params: RequestParams, middlewares: Middleware[] = []): Promise<Response | Middleware> => {
    try {
      for (let index = 0; index < middlewares.length; index++) {
        const middleware = middlewares[index];
        const response = await middleware(params);
        if(response) {
          return response;
        }
      }

      return res_204();
    } catch(e: any) {
      return new Response(e.message);
    }
};