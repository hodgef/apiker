import { Handlers, Options, Routes } from "./interfaces";

class Apiker {
  routes!: Routes;
  handlers!: Handlers;
  debug!: boolean;
  state!: any;

  init = (options: Options) => Object.assign(this, options);
}

const apiker = new Apiker();
export { apiker };
