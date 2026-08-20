import { Actions } from "./interfaces";

export const ADMIN_LOGIN_PREFIX = "admin-login";

/** Shared with the login endpoint, so the CSRF token it mints targets the right client widget. */
export const ADMIN_PAGE_NAME = "AdminPanelPage";

export const defaultActions: Actions = [
    {
        id: "login",
        displayName: "Login",
        icon: "login"
    }
];

export const authActions: Actions = [
    {
        id: "listUsers",
        displayName: "List Users",
        description: "See every account this deployment holds.",
        icon: "group",
        group: "Users"
    },
    {
        id: "addAdmin",
        displayName: "Add Admin",
        description: "Grant admin rights to a new or existing account.",
        icon: "admin_panel_settings",
        group: "Users"
    },
    {
        id: "updateUser",
        displayName: "Update User",
        description: "Look up an account and edit its stored record.",
        icon: "manage_accounts",
        group: "Users"
    },
    {
        id: "deleteUser",
        displayName: "Delete User",
        description: "Permanently remove an account.",
        icon: "person_remove",
        group: "Users"
    },
    {
        id: "sendEmail",
        displayName: "Send Email",
        description: "Re-send a transactional email template.",
        icon: "outgoing_mail",
        group: "Users"
    },
    {
        id: "banUser",
        displayName: "Ban User",
        description: "Block a user id from reaching the API.",
        icon: "block",
        group: "Moderation"
    },
    {
        id: "unbanUser",
        displayName: "Unban User",
        description: "Restore access for a banned user id.",
        icon: "lock_open",
        group: "Moderation"
    },
    {
        id: "searchBans",
        displayName: "Search Bans",
        description: "Review the ban entries recorded for a user.",
        icon: "person_search",
        group: "Moderation"
    },
    {
        id: "beacons",
        displayName: "Beacons",
        description: "Traffic and events this deployment recorded for itself.",
        icon: "monitoring",
        group: "Diagnostics"
    },
    {
        id: "listLogs",
        displayName: "List Logs",
        description: "Browse every log this deployment records.",
        icon: "receipt_long",
        group: "Diagnostics"
    },
];