import { Actions } from "./interfaces";

export const ADMIN_LOGIN_PREFIX = "admin-login";

export const defaultActions: Actions = [
    {
        id: "login",
        displayName: "Login"
    }
];

export const authActions: Actions = [
    {
        id: "banUser",
        displayName: "Ban User"
    },
    {
        id: "unbanUser",
        displayName: "Unban User"
    },
    {
        id: "searchBans",
        displayName: "Search Bans"
    },
    {
        id: "sendEmail",
        displayName: "Send Email"
    },
    {
        id: "updateUser",
        displayName: "Update User"
    }
];