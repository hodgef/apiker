import React from "react";
import { Header } from "./Header";
import { Content } from "./Content";
import { wrapReactPage } from "../Page";
import { Handler } from "../Request";

//@ts-ignore
import css from "@panelAssets/css/panel.css";

export const adminPanelPage: Handler = async ({ state }) => {
    const props = {};
    return wrapReactPage('AdminPanelPage', <AdminPanelPage {...props} />, props, css);
}

const actions: {
    id: string;
    displayName: string;
}[] = [
        {
            id: "login",
            displayName: "Login"
        }
    ];


export const AdminPanelPage: React.FC = () => {
    const [action, setAction] = React.useState<string>();

    const onDropdownItemClick = (id: string) => {
        setAction(id);
        console.log("Action set", id);
    }

    const dropdown = (
        <div className="btn-group">
            <button className="btn btn-transparent btn-lg dropdown-toggle action-dropdown" type="button" id="main-dropdown" data-bs-toggle="dropdown" aria-expanded="false">
                {action ? action : "Select action"}
            </button>
            <ul className="dropdown-menu" aria-labelledby="main-dropdown">
                {actions.map(({ id, displayName }) => {
                    return (
                        <li key={id}><a className="dropdown-item" href="#" onClick={() => onDropdownItemClick(id)}>{displayName}</a></li>
                    )
                })}
            </ul>
        </div>
    )

    return (
        <>
            <Header />
            <Content>
                {dropdown}
            </Content>
        </>
    )
};