export interface Routes {
  [route: string]: any;
}

export interface Controllers {
  [className: string]: Controller;
}

export interface Options {
  routes?: Routes;
  controllers?: Controllers;
  debug?: boolean;
  state?: any;
  objectVersion?: string;
  exports?: any;
  objects?: string[];
  env?: any;
  auth?: boolean;
  headers?: Headers;
}

export type Controller = new (...args: any[]) => any;