import React from "react";

//@ts-ignore
import logo from "@panelAssets/images/logo.svg";

interface HeaderProps {
    appName?: string;
    identity?: string;
}

export const Header: React.FC<HeaderProps> = ({ appName = "Apiker", identity }) => {
    return (
        <nav className="admp-topbar">
            <a className="admp-topbar__brand" href="/admp">
                <img src={logo} alt="" />
                <span>{appName}</span>
            </a>
            <span className="admp-badge">Admin</span>
            {identity && (
                <span className="admp-topbar__identity" title={identity}>
                    <span className="material-symbols-outlined" aria-hidden="true">badge</span>
                    <span className="admp-topbar__identity-value">{identity}</span>
                </span>
            )}
        </nav>
      )
}