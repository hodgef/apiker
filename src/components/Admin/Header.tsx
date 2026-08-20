import React from "react";
import { Icon, Tooltip } from "./ui";

//@ts-ignore
import logo from "@panelAssets/images/logo.svg";

interface HeaderProps {
    appName?: string;
    identity?: string;
    onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ appName = "Apiker", identity, onLogout }) => {
    return (
        <nav className="admp-topbar">
            <a className="admp-topbar__brand" href="/admp">
                <img src={logo} alt="" />
                <span>{appName}</span>
            </a>
            <span className="admp-badge">Admin</span>
            {identity && (
                <Tooltip
                    side="bottom"
                    label="Your request identity (signed IP) — used for bans and rate limits, not an account"
                >
                    <span className="admp-topbar__identity">
                        <span className="material-symbols-outlined" aria-hidden="true">badge</span>
                        <span className="admp-topbar__identity-value">{identity}</span>
                    </span>
                </Tooltip>
            )}
            {onLogout && (
                <Tooltip side="bottom" label="Log out">
                    <button type="button" className="admp-topbar__logout" onClick={onLogout} aria-label="Log out">
                        <Icon name="logout" />
                    </button>
                </Tooltip>
            )}
        </nav>
      )
}