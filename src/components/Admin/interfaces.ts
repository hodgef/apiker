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
    /** Shown on the overview tile and under the page title. */
    description?: string;
    /** Material Symbols glyph name. */
    icon?: string;
    /** Sidebar section this action is listed under. */
    group?: string;
}

export type Actions = Action[];

export interface Dialog {
    className: string;
    message: string;
}

/** A screen the panel can return to. */
export interface HistoryEntry {
    actionId?: string;
    presetValue?: string;
    presetFilter?: string;
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
    appName?: string;
    /** Value the dashboard hands to the action it opens. */
    presetValue?: string;
    /** What that value means to the action, when it accepts more than one filter. */
    presetFilter?: string;
    /** Screens opened before this one, most recent last. */
    history?: HistoryEntry[];
}

export interface LogResults {
    time?: string;
    id?: string;
    userId?: string;
    clientId?: string;
    countryCode?: string;
    pathname?: string;
    issuedBy?: string;
}

export interface LoginPageProps extends AdminPanelPageProps {}
export interface AddAdminPageProps extends AdminPanelPageProps {}
export interface ListUsersPageProps extends AdminPanelPageProps {}
export interface BanUserPageProps extends AdminPanelPageProps {}
export interface UnbanUserPageProps extends AdminPanelPageProps {}
export interface SearchBansPageProps extends AdminPanelPageProps {}
export interface ListLogsPageProps extends AdminPanelPageProps {}
export interface BeaconsPageProps extends AdminPanelPageProps {}
export interface SendEmailPageProps extends AdminPanelPageProps {}
export interface UpdateUserPageProps extends AdminPanelPageProps {}
export interface DeleteUserPageProps extends AdminPanelPageProps {}