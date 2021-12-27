import { getAuthRoutes } from "../Auth";
import ObjectBase from "../ObjectBase/ObjectBase";
import { handleEntryRequest } from "../Request";
import type { Controllers, Firewall, Options, Routes } from "./interfaces";

class Apiker {
  routes: Routes = {};
  controllers: Controllers = {};
  debug = false;
  objectVersion = "V1";
  objects!: string[];
  auth!: boolean;
  env: any;
  headers!: Headers;
  responseHeaders!: Headers;
  firewall!: Firewall;

  defaultObjectName = "Common";

  /**
   * Initialize Apiker, perform basic validation
   */
  init = (options: Options = {}) => {
    try {
      /**
       * Extract options
       */
      const { routes, controllers = {} as Controllers, objects, exports, firewall, auth = false } = options;

      /**
       * Check for requires params
       */
      if(!(routes && objects && exports)){
        throw new Error("Missing required parameters, please consult the Apiker documentation");
      }

      /**
       * Assign options
       */
      this.setProps({ routes, controllers, objects, auth, firewall });

      /**
       * If auth option is set to true, set auth routes
       */
      if(auth){
        this.routes = {
          ...this.routes,
          ...getAuthRoutes()
        };
      }

      /**
       * Prepare worker exports
       */
      const workerExports = {
        handlers: {
          fetch: handleEntryRequest
        }
      };

      /**
       * Adding named objects to exports
       */
      this.objects.forEach((objectName: string) => {
        workerExports[objectName] = this.getObjectClassDefinition(objectName);
      });

      Object.assign(exports, workerExports);
    } catch (e: any) {
      return new Response(e.message);
    }
  };

  /**
   * Set options
   */
   setProps = (options: Options = {}) => {
     Object.assign(this, options);
   }

  /**
   * Creates a durable object class definition
   */
  getObjectClassDefinition = (objectName: string) => {
    return ({[objectName] : class extends ObjectBase {}})[objectName];
  }
}

const apiker = new Apiker();
export { apiker };
