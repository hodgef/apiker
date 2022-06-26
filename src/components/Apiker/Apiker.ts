import { getAdminRoutes } from "../Admin";
import { getAuthRoutes } from "../Auth";
import { OBMT } from "../ObjectBase";
import ObjectBase from "../ObjectBase/ObjectBase";
import { handleEntryRequest, RequestParams } from "../Request";
import type { Controllers, EmailOptions, Firewall, ObjectStateMapping, Options, Routes, Timings } from "./interfaces";

class Apiker {
  name = "Apiker";
  routes: Routes = {};
  controllers: Controllers = {};
  debug = false;
  objectVersion = "V1";
  objects!: string[];
  objectStateMapping!: ObjectStateMapping;
  authRoutes!: boolean;
  env: any;
  requestParams!: RequestParams;
  responseHeaders!: Headers;
  firewall!: Firewall | boolean;
  adminPanel!: boolean;
  email?: EmailOptions;
  timings: Timings = {};

  defaultObjectName = "Common";

  /**
   * Initialize Apiker, perform basic validation
   */
  init = (options: Options = {}) => {
    try {
      const defaultObjectStateMapping = {
        CounterUser: OBMT.SIGNEDIP,
        RateLimit: OBMT.SIGNEDIP,
        Logs: OBMT.SIGNEDIP,
        Bans: OBMT.SIGNEDIP
      };

      /**
       * Extract options
       */
      const {
        routes,
        controllers = {} as Controllers,
        objectStateMapping = defaultObjectStateMapping,
        objects,
        exports,
        firewall,
        adminPanel = false,
        authRoutes = false,
        name,
        email,
        debug
      } = options;

      /**
       * Check for required params
       */
      if(!(routes && objects && exports)){
        throw new Error("Missing required parameters, please consult the Apiker documentation");
      }

      /**
       * Assign options
       */
      this.setProps({ routes, controllers, objects, authRoutes, adminPanel, firewall, name, email, debug, objectStateMapping });

      /**
       * If authRoutes option is set to true, set auth routes
       */
      if(authRoutes){
        this.routes = {
          ...getAuthRoutes(),
          ...this.routes
        };
      }

      /**
       * If adminPanel option is set to true, set admin panel routes
       */
      if(adminPanel){
        this.routes = {
          ...getAdminRoutes(),
          ...this.routes
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
