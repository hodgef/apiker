//@ts-ignore
import css from "@panelAssets/css/panel.css";

import React from "react";
import { Header } from "./Header";
import { Content } from "./Content";
import { wrapReactPage } from "../Page";
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

export const adminPanelPage: Handler = async ({ state }) => {
    const pageName = "AdminPanelPage";
    const adminIds = await state(OBN.COMMON).get("adminIds");
    const hasAdmins = !!adminIds?.length;
    
    const user = await getCurrentUser();
    const isAdminLoggedIn = user?.role === "admin";
    const csrfToken = createJWT({ sub: user?.id, pageName }, 60);

    const userSignedIp = isAdminLoggedIn ? getSignedIp() : undefined;

    const props = { isSetup: !hasAdmins, pageName, csrfToken, isAdminLoggedIn, userSignedIp } as AdminPanelPageProps;
    return wrapReactPage('AdminPanelPage', <AdminPanelPage {...props} />, props, css);
}

const actionsComponent = {
    login: Login,
    banUser: BanUser,
    unbanUser: UnbanUser,
    searchBans: SearchBans,
    sendEmail: SendEmail,
    updateUser: UpdateUser,
    deleteUser: DeleteUser
};

export const AdminPanelPage: React.FC<AdminPanelPageProps> = (props) => {
    let { userSignedIp, isAdminLoggedIn, action, actions = defaultActions, dialog, pageName = "" } = props;
    const { setProps } = getAppHelper(pageName);
    let ActionComponent = action ? actionsComponent[action.id] : null;

    if(isAdminLoggedIn){
        actions = authActions;
    }

    const onDropdownItemClick = (action: Action) => {
        setProps({ ...props, action, dialog: undefined });
    }

    const actionDropdown = (
        <div className="btn-group">
            <button className="btn btn-transparent btn-lg dropdown-toggle action-dropdown" type="button" id="main-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                {action ? action.displayName : "Select action"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="main-dropdown">
                {actions.map((currentAction) => {
                    const { id, displayName } = currentAction;
                    return (
                        <li key={id}><a className="dropdown-item" href="#" onClick={() => onDropdownItemClick(currentAction)}>{displayName}</a></li>
                    )
                })}
            </ul>
        </div>
    )

    return (
        <>
            <Header>
                {dialog && <Dialog {...props} />}
            </Header>
            <Content>
                {actionDropdown}
                {ActionComponent && <ActionComponent {...props} />}
                {userSignedIp && <div className="signed-ip">Your ID: {userSignedIp}</div>}
            </Content>
        </>
    )
};