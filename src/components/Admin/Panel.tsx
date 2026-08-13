//@ts-ignore
import css from "@panelAssets/css/panel.css";

import React from "react";
import { Header } from "./Header";
import { Content, Overview, Sidebar } from "./Content";
import { wrapAdminReactPage } from "../Page";
import { Handler } from "../Request";
import { getAppHelper } from "./Utils";
import { Action, AdminPanelPageProps } from "./interfaces";
import { Login } from "./Actions/Login";
import { OBN } from "../ObjectBase";
import { createJWT, getCurrentUser, getSignedIp } from "../Auth";
import { Dialog } from "./Dialog";
import { authActions, defaultActions } from "./constants";
import { BanUser } from "./Actions/BanUser";
import { UnbanUser } from "./Actions/UnbanUser";
import { SearchBans } from "./Actions/SearchBans";
import { SendEmail } from "./Actions/SendEmail";
import { UpdateUser } from "./Actions/UpdateUser";
import { DeleteUser } from "./Actions/DeleteUser";
import { ListLogs } from "./Actions/ListLogs";
import { AddAdmin } from "./Actions/AddAdmin";
import { Card } from "./ui";
import { apiker } from "../Apiker";

export const adminPanelPage: Handler = async ({ state }) => {
    const pageName = "AdminPanelPage";
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
    addAdmin: AddAdmin,
    banUser: BanUser,
    unbanUser: UnbanUser,
    searchBans: SearchBans,
    listLogs: ListLogs,
    sendEmail: SendEmail,
    updateUser: UpdateUser,
    deleteUser: DeleteUser
};

export const AdminPanelPage: React.FC<AdminPanelPageProps> = (props) => {
    let { userSignedIp, isAdminLoggedIn, isSetup, action, dialog, pageName = "", appName } = props;
    const { setProps } = getAppHelper(pageName);
    const actions = isAdminLoggedIn ? authActions : defaultActions;
    const ActionComponent = action ? actionsComponent[action.id] : null;

    const onSelectAction = (selected?: Action) => {
        setProps({ ...props, action: selected, dialog: undefined });
    }

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
            <Header appName={appName} identity={userSignedIp} />
            <div className="admp-layout">
                <Sidebar actions={actions} action={action} onSelect={onSelectAction} />
                <Content
                    title={action ? action.displayName : "Overview"}
                    description={
                        action
                            ? action.description
                            : `Run maintenance and moderation actions against ${appName || "this deployment"}.`
                    }
                >
                    {ActionComponent ? (
                        <Card>
                            <ActionComponent {...props} />
                        </Card>
                    ) : (
                        <Overview actions={actions} onSelect={onSelectAction} />
                    )}
                </Content>
            </div>
            {toasts}
        </>
    )
};