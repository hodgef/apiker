import React from "react";

//@ts-ignore
import logo from "@panelAssets/images/logo.svg";

export const Header = ({ children } = {} as any) => {
    return (
        <nav className="navbar navbar-expand-lg navbar-light px-3">
            <a className="navbar-brand" href="#"><img src={logo} height="59" width="52" /></a>
            {children}
        </nav>
      )
}