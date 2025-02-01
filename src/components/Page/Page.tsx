import React from "react";
import ReactDOMServer from "react-dom/server";
import { resRaw } from "../Response";
import { apiker } from "../Apiker";

export const pageHeader = (head = "") => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
           ${head} 
        </head>
        <body>
            <div id="app">
`;

export const pageFooter = (prepend = "") => `
        </div>
        ${prepend}
    </body>
    </html>
`;

export const adminPageHeader = (styles = "") => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Apiker</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
            <style>
                * {
                    --bs-primary: #2e3191;
                    --bs-dropdown-link-active-bg: #2e3191;
                }
                body {
                    margin: 0px;
                }
                .material-symbols-outlined {
                    font-variation-settings:
                    'FILL' 0,
                    'wght' 400,
                    'GRAD' 0,
                    'opsz' 24
                }
                ${styles}
            </style>
        </head>
        <body>
            <div id="app">
`;

export const adminPageFooter = (prepend = "") => `
        </div>
        <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script src="/admp/static.js"></script>
        ${prepend}
    </body>
    </html>
`;

export const wrapPage = (pageContent: string, headHtml = "", footerHtml = "") => resRaw(pageHeader(headHtml) + pageContent + pageFooter(footerHtml));

export const wrapReactPage = (componentName: string, pageComponent: React.ReactElement, props = {}, styles = "") => {
    let pageContent = ReactDOMServer.renderToString(pageComponent);

    apiker.responseHeaders.set("Content-Security-Policy", "frame-ancestors 'none';");
    apiker.responseHeaders.set("X-Frame-Options", "deny");

    return resRaw(pageHeader(styles) + pageContent + pageFooter(`
        <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
        <script>
            window.appRoot = (action, componentName, props = {}) => {
                const domNode = document.getElementById("app");
                const root = ReactDOM.createRoot(domNode);

                const componentProps = {
                    ...props
                };

                if(!window.initializeAppHelper){
                    window.initializeAppHelper = (componentName) => ({
                        setProps: (newProps) => root.render(pages[componentName](newProps))
                    });
                }

                if(action === "hydrate"){
                    pages.ReactDOM.hydrate(pages[componentName](componentProps), app);

                } else if (action === "render") {
                    root.render(pages[componentName](componentProps));
                }
            };
            window.appRoot("hydrate", "${componentName}", ${JSON.stringify(props)});
        </script>
    `));
}

export const wrapAdminReactPage = (componentName: string, pageComponent: React.ReactElement, props = {}, styles = "") => {
    let pageContent = ReactDOMServer.renderToString(pageComponent);

    apiker.responseHeaders.set("Content-Security-Policy", "frame-ancestors 'none';");
    apiker.responseHeaders.set("X-Frame-Options", "deny");

    return resRaw(adminPageHeader(styles) + pageContent + adminPageFooter(`
        <script>
            window.appRoot = (action, componentName, props = {}) => {
                const domNode = document.getElementById("app");
                const root = ReactDOM.createRoot(domNode);

                const componentProps = {
                    ...props
                };

                if(!window.initializeAppHelper){
                    window.initializeAppHelper = (componentName) => ({
                        setProps: (newProps) => root.render(pages[componentName](newProps))
                    });
                }

                if(action === "hydrate"){
                    pages.ReactDOM.hydrate(pages[componentName](componentProps), app);

                } else if (action === "render") {
                    root.render(pages[componentName](componentProps));
                }
            };
            window.appRoot("hydrate", "${componentName}", ${JSON.stringify(props)});
        </script>
    `));
}