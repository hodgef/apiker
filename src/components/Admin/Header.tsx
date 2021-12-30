import React from "react";
import { PortalSection, PortalSections } from "./interfaces";

export const PanelHeader: React.FC = ({ currentSection = "home" }) => {
    const sections: PortalSections = [
        {
            name: "home",
            title: "Home",
            link: "/admp/dashboard"
        },
        {
            name: "tools",
            title: "Tools",
            children: [
                {
                    name: "ban-client",
                    title: "Ban Client",
                    link: "/admp/ban-client"
                }
            ]
        }
    ];

    const renderSection = ({ name, title, children = [], link = "#" }: Partial<PortalSection>) => {
        return (
            <li className={`nav-item ${children.length ? "dropdown": ""}`}>
                <a
                    className={`nav-link ${currentSection === name ? "active" : ""} ${children.length ? "dropdown-toggle": ""}`}
                    href={link}
                    {...(children.length ? {"data-bs-toggle": "dropdown"} : {})}
                >{title}</a>
                {children.length ? <ul className="dropdown-menu">{children.map(renderSection)}</ul> : null}
            </li>
        );
    }

    return (
        <nav className="navbar mb-4 navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Dashboard</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNavDropdown">
                    <ul className="navbar-nav">
                        {sections.map(renderSection)}
                    </ul>
                </div>
            </div>
        </nav>
    );
}