//@ts-ignore
import css from "@panelAssets/css/panel.css";

import React from "react";
import { Header } from "./Header";
import { Content, Sidebar } from "./Content";
import { Dashboard } from "./Dashboard";
import { wrapAdminReactPage } from "../Page";
import { Handler } from "../Request";
import { getAppHelper } from "./Utils";
import { Action, AdminPanelPageProps } from "./interfaces";
import { Login } from "./Actions/Login";
import { OBN } from "../ObjectBase";
import { createJWT, getCurrentUser, getSignedIp } from "../Auth";
import { Dialog } from "./Dialog";
import { ADMIN_PAGE_NAME, authActions, defaultActions } from "./constants";
import { BanUser } from "./Actions/BanUser";
import { UnbanUser } from "./Actions/UnbanUser";
import { SearchBans } from "./Actions/SearchBans";
import { SendEmail } from "./Actions/SendEmail";
import { UpdateUser } from "./Actions/UpdateUser";
import { DeleteUser } from "./Actions/DeleteUser";
import { ListLogs } from "./Actions/ListLogs";
import { RateLimitHistory } from "./Actions/RateLimitHistory";
import { Beacons } from "./Actions/Beacons";
import { AddAdmin } from "./Actions/AddAdmin";
import { ListUsers } from "./Actions/ListUsers";
import { Card } from "./ui";
import { apiker } from "../Apiker";

export const adminPanelPage: Handler = async ({ state }) => {
    const pageName = ADMIN_PAGE_NAME;
    const adminIds = await state(OBN.COMMON).get("adminIds");
    const hasAdmins = !!adminIds?.length;
    
    const user = await getCurrentUser();
    const isAdminLoggedIn = user?.role === "admin";
    const csrfToken = createJWT({ sub: user?.id, pageName }, 60);

    const userSignedIp = isAdminLoggedIn ? getSignedIp() : undefined;

    const props = { isSetup: !hasAdmins, pageName, csrfToken, isAdminLoggedIn, userSignedIp, appName: apiker.name } as AdminPanelPageProps;
    return wrapAdminReactPage('AdminPanelPage', <AdminPanelPage {...props} />, props, css);
}

const actionsComponent = {
    login: Login,
    listUsers: ListUsers,
    addAdmin: AddAdmin,
    banUser: BanUser,
    unbanUser: UnbanUser,
    searchBans: SearchBans,
    listLogs: ListLogs,
    rateLimitHistory: RateLimitHistory,
    beacons: Beacons,
    sendEmail: SendEmail,
    updateUser: UpdateUser,
    deleteUser: DeleteUser
};

export const AdminPanelPage: React.FC<AdminPanelPageProps> = (props) => {
    let { userSignedIp, isAdminLoggedIn, isSetup, action, dialog, pageName = "", csrfToken = "", appName, presetValue, presetFilter, history = [] } = props;
    const { setProps } = getAppHelper(pageName);
    const actions = isAdminLoggedIn ? authActions : defaultActions;
    const ActionComponent = action ? actionsComponent[action.id] : null;

    /** Clears the session cookie, then reloads so the server re-renders the signed-out page. */
    const onLogout = () => {
        fetch("/admp/logout", { method: "post", headers: { "X-Apiker-Csrf": csrfToken } })
            .finally(() => window.location.reload());
    };

    const onSelectAction = (selected?: Action, nextPresetValue?: string, nextPresetFilter?: string) => {
        setProps({
            ...props,
            action: selected,
            presetValue: nextPresetValue,
            presetFilter: nextPresetFilter,
            history: [...history, { actionId: action?.id, presetValue, presetFilter }],
            dialog: undefined
        });
    };

    /** Rewinds one screen, keeping the filters it was opened with. */
    const onBack = () => {
        const previous = history[history.length - 1];

        setProps({
            ...props,
            action: actions.find(({ id }) => id === previous?.actionId),
            presetValue: previous?.presetValue,
            presetFilter: previous?.presetFilter,
            history: history.slice(0, -1),
            dialog: undefined
        });
    };

    const previousAction = history.length
        ? actions.find(({ id }) => id === history[history.length - 1]?.actionId)
        : undefined;

    const toasts = <div className="admp-toasts">{dialog && <Dialog {...props} />}</div>;

    if (!isAdminLoggedIn) {
        return (
            <>
                <Header appName={appName} />
                <div className="admp-auth">
                    <Card
                        title={isSetup ? "Create the admin account" : "Sign in"}
                        description={
                            isSetup
                                ? "This deployment has no administrator yet."
                                : "This area is restricted to administrators."
                        }
                    >
                        <Login {...props} />
                    </Card>
                </div>
                {toasts}
            </>
        );
    }

    return (
        <>
            <Header appName={appName} identity={userSignedIp} onLogout={onLogout} />
            <div className="admp-layout">
                <Sidebar actions={actions} action={action} onSelect={onSelectAction} />
                <Content
                    title={action ? action.displayName : "Overview"}
                    description={
                        action
                            ? action.description
                            : `Run maintenance and moderation actions against ${appName || "this deployment"}.`
                    }
                    onBack={history.length ? onBack : undefined}
                    backLabel={`Back to ${previousAction ? previousAction.displayName : "Overview"}`}
                >
                    {ActionComponent ? (
                        <Card>
                            <ActionComponent {...props} />
                        </Card>
                    ) : (
                        <Dashboard {...props} actions={actions} onSelect={onSelectAction} />
                    )}
                </Content>
            </div>
            {toasts}
        </>
    )
};