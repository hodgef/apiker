import React from "react";
import { Action, Actions } from "./interfaces";
import { Icon, Tooltip } from "./ui";

interface ActionGroup {
    name: string;
    items: Actions;
}

/** Groups are ordered by first appearance so custom actions slot in predictably. */
const groupActions = (actions: Actions): ActionGroup[] => {
    const groups: ActionGroup[] = [];

    actions.forEach((item) => {
        const name = item.group || "Actions";
        let group = groups.find((candidate) => candidate.name === name);

        if (!group) {
            group = { name, items: [] };
            groups.push(group);
        }

        group.items.push(item);
    });

    return groups;
};

interface SidebarProps {
    actions: Actions;
    action?: Action;
    onSelect: (action?: Action) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ actions, action, onSelect }) => (
    <aside className="admp-sidebar">
        <nav className="admp-nav">
            <button
                type="button"
                className={`admp-nav__item${action ? "" : " is-active"}`}
                onClick={() => onSelect(undefined)}
            >
                <Icon name="dashboard" />
                <span>Overview</span>
            </button>
            {groupActions(actions).map((group) => (
                <div className="admp-nav__group" key={group.name}>
                    <span className="admp-nav__label">{group.name}</span>
                    {group.items.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`admp-nav__item${action?.id === item.id ? " is-active" : ""}`}
                            onClick={() => onSelect(item)}
                        >
                            <Icon name={item.icon} />
                            <span>{item.displayName}</span>
                        </button>
                    ))}
                </div>
            ))}
        </nav>
    </aside>
);

interface ContentProps {
    title?: string;
    description?: string;
    onBack?: () => void;
    backLabel?: string;
    children?: React.ReactNode;
}

export const Content: React.FC<ContentProps> = ({ title, description, onBack, backLabel, children }) => (
    <main className="admp-main">
        {(title || description) && (
            <div className="admp-heading">
                <div className="admp-heading__title">
                    {onBack && (
                        <Tooltip label={backLabel || "Back"}>
                            <button
                                type="button"
                                className="admp-back"
                                aria-label={backLabel || "Back"}
                                onClick={onBack}
                            >
                                <Icon name="arrow_back" />
                            </button>
                        </Tooltip>
                    )}
                    {title && <h1>{title}</h1>}
                </div>
                {description && <p>{description}</p>}
            </div>
        )}
        {children}
    </main>
);