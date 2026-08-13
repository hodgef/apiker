import React from "react";
import { AdminPanelPageProps } from "./interfaces";
import { getAppHelper } from "./Utils";
import { Alert } from "./ui";

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
            }, 4000);
        }
    }, [dialog]);

    if(!showDialog){
        return null;
    }

    // Existing callers pass Bootstrap alert class names.
    const tone = className?.includes("danger") ? "danger" : "success";

    return <Alert tone={tone} onDismiss={onClose}>{message}</Alert>;
}