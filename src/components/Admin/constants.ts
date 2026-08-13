import { Actions } from "./interfaces";

export const ADMIN_LOGIN_PREFIX = "admin-login";

export const defaultActions: Actions = [
    {
        id: "login",
        displayName: "Login",
        icon: "login"
    }
];

export const authActions: Actions = [
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
        id: "listLogs",
        displayName: "List Logs",
        description: "Inspect request logs by log id.",
        icon: "receipt_long",
        group: "Diagnostics"
    },
];