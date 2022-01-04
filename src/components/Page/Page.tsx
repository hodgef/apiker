import React from "react";
import ReactDOMServer from "react-dom/server";
import { resRaw } from "../Response";

export const pageHeader = (styles = "") => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>Apiker</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" />
            <style>
                body {
                    margin: 0px;
                }
                ${styles}
            </style>
        </head>
        <body>
            <div id="app">
`;

export const pageFooter = (prepend = "") => `
        </div>
        <script src="https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.production.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js"></script>
        <script src="/admp/static.js"></script>
        ${prepend}
    </body>
    </html>
`;

export const wrapPage = (pageContent: string, styles = "") => resRaw(pageHeader(styles) + pageContent + pageFooter());

export const wrapReactPage = (componentName: string, pageComponent: React.FC, props = {}, styles = "") => {
    let pageContent = ReactDOMServer.renderToString(pageComponent);
    return resRaw(pageHeader(styles) + pageContent + pageFooter(`
        <script>
            const app = document.querySelector("#app");
            ReactDOM.hydrate(pages["${componentName}"](${JSON.stringify(props)}), app);
        </script>
    `));
}