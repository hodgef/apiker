import React from "react";
import { AdminPanelPageProps } from "./interfaces";
import { getAppHelper } from "./Utils";

export const Dialog: React.FC<AdminPanelPageProps> = (props) => {
    const [ showDialog, setShowDialog ] = React.useState(false);
    const { dialog, pageName = "" } = props;
    const { className, message } = dialog || {};
    const { setProps } = getAppHelper(pageName);

    const onClose = () => {
        setProps({
            ...props,
            dialog: undefined
        })
    }

    React.useEffect(() => {
        if(dialog){
            setShowDialog(true);
            setTimeout(() => {
                setShowDialog(false);
            }, 2000);
        }
    }, [dialog]);
    
    return (
        <div>
            <div className={`alert ${className} mt-0 mb-0 alert-dismissible fade ${showDialog ? "show": ""}`} role="alert">
                <strong>Status:</strong> {message}
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
        </div>
    );
}