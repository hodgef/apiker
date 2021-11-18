import { getAuthRoutes } from "../Auth";
import ObjectBase from "../ObjectBase/ObjectBase";
import { handleEntryRequest } from "../Request";
import type { Controllers, Options, Routes } from "./interfaces";

class Apiker {
  routes: Routes = {};
  controllers: Controllers = {};
  debug = false;
  objectVersion = "V1";
  secretKey!: string;
  objects!: string[];
  auth!: boolean;
  env: any;
  headers!: Headers;

  defaultObjectName = "Common";

  /**
   * Initialize Apiker, perform basic validation
   */
  init = (options: Options = {}) => {
    try {
      /**
       * Extract options
       */
      const { routes, controllers, objects, exports, auth = false } = options;

      /**
       * Check for requires params
       */
      if(!(routes && controllers && objects && exports)){
        throw new Error("Missing required parameters, please consult the Apiker documentation");
      }

      /**
       * Assign options
       */
      this.setProps({ routes, controllers, objects, auth });

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

     /**
     * If auth route has been provided, get auth routes
     */
     if(this.auth){
       this.routes = {
         ...this.routes,
         ...getAuthRoutes()
       };
     }
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
