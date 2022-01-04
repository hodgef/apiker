import { readRequestBody } from "../Request";
import { res, res_404 } from "../Response";
export default class {
    state;

    constructor(state){
      this.state = state;
    }

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