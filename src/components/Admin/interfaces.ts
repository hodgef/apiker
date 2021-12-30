export type PortalSections = PortalSection[];

export interface PortalSection {
    name: string;
    title: string;
    link?: string;
    children?: PortalSection[];
}