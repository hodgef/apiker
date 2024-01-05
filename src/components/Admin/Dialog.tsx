import React from "react";
import { AdminPanelPageProps } from "./interfaces";
import { getAppHelper } from "./Utils";

export const Dialog: React.FC<AdminPanelPageProps> = (props) => {
    const { dialog, pageName = "" } = props;
    const { className, message } = dialog || {};
    const { setProps } = getAppHelper(pageName);

    const onClose = () => {
        setProps({
            ...props,
            dialog: undefined
        })
    }
    
    return (
        <div>
            <div className={`alert ${className} mt-0 mb-0 alert-dismissible fade show`} role="alert">
                <strong>Status:</strong> {message}
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
        </div>
    );
}