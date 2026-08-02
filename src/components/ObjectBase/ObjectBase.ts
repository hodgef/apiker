import { readRequestBody } from "../Request";
import { res, res_404 } from "../Response";

/**
 * Base class for every named Durable Object. Apiker generates a subclass of this
 * per entry in `apiker.init({ objects })`.
 *
 * Its `fetch` handler exposes the object's persistent storage over HTTP-style
 * routes (`/get`, `/put`, `/delete`, `/deleteall`, `/list`) that the client-side
 * `state` proxy calls into.
 */
export default class {
    /** The Durable Object state provided by the Workers runtime (holds `storage`). */
    state;

    constructor(state){
      this.state = state;
    }

    /**
     * Dispatches a storage operation based on the request pathname.
     *
     * @param request Request whose path selects the operation and whose body
     *   carries the operation arguments.
     * @returns The operation result, or a `404` for an unknown path.
     */
    fetch = async (request) => {
      const url = new URL(request.url);
      const { pathname } = url;
    
      const requestBody = await readRequestBody(request);

      if(pathname.startsWith("/get")){
        return new Response(JSON.stringify(await this.state.storage.get(requestBody.propertyName)));

      } else if(pathname.startsWith("/put")){
        await Promise.all(
          Object.keys(requestBody).map(propertyName => this.state.storage.put(propertyName, requestBody[propertyName]))
        );

        return res("Success");

      } else if(pathname.startsWith("/deleteall")){
        await this.state.storage.deleteAll();
        return res("Success");

      } else if(pathname.startsWith("/delete")){
        await this.state.storage.delete(requestBody.propertyName);
        return res("Success");

      } else if(pathname.startsWith("/list")){
        const resList = (Object as any).fromEntries(await this.state.storage.list(requestBody));
        const resJson = JSON.stringify(resList);
        return new Response(resJson);

      } else {
        return res_404();
      }
    }
}