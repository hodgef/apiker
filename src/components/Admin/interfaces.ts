export interface PanelWindow {
    appRoot: (action: string, componentName: string, props: any) => void;
    initializeAppHelper: (componentName: string) => ({
        setProps: (componentProps: Partial<AdminPanelPageProps>) => void;
    });
}

export type PortalSections = PortalSection[];

export interface PortalSection {
    name: string;
    title: string;
    link?: string;
    children?: PortalSection[];
}

export interface Action {
    id: string;
    displayName: string;
}

export type Actions = Action[];

export interface Dialog {
    className: string;
    message: string;
}

export interface AdminPanelPageProps {
    pageName?: string;
    action?: Action;
    actions?: Actions;
    isSetup?: boolean;
    csrfToken?: string;
    dialog?: Dialog;
    isAdminLoggedIn?: boolean;
    userSignedIp?: string;
}

export interface LogResults {
    time?: string;
    id?: string;
    clientId?: string;
    countryCode?: string;
    pathname?: string;
    issuedBy?: string;
}

export interface LoginPageProps extends AdminPanelPageProps {}
export interface BanUserPageProps extends AdminPanelPageProps {}
export interface UnbanUserPageProps extends AdminPanelPageProps {}
export interface SearchBansPageProps extends AdminPanelPageProps {}