import { PanelWindow } from "./interfaces";

export const getAppHelper = (pageName: string) => (globalThis as unknown as PanelWindow)?.initializeAppHelper?.(pageName) || {} as any;