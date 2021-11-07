export interface Routes {
  [route: string]: string
}

export interface Handlers {
  [className: string]: Handler;
}

export interface Options {
  routes?: Routes;
  handlers?: Handlers;
  debug?: boolean;
  state?: any;
}

export type Handler = new (...args: any[]) => any;