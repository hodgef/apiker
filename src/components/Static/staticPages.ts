export const apikerPagesStatic = `const pages = (function (React, ReactDOMServer, cryptojs, bcrypt) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
    var cryptojs__default = /*#__PURE__*/_interopDefaultLegacy(cryptojs);
    var bcrypt__default = /*#__PURE__*/_interopDefaultLegacy(bcrypt);

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    cryptojs__default["default"]();
    bcrypt__default["default"]();

    var getFlagEmoji = function (countryCode) {
        var codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(function (char) { return 127397 + char.charCodeAt(); });
        return String.fromCodePoint.apply(String, codePoints);
    };

    var PanelHeader = function (_a) {
        var _b = _a.currentSection, currentSection = _b === void 0 ? "home" : _b, rateLimitMax = _a.rateLimitMax, rateLimitRemaining = _a.rateLimitRemaining;
        var sections = [
            {
                name: "home",
                title: "Home",
                link: "/admp/dashboard"
            },
            {
                name: "visitors",
                title: "Visitors",
                link: "/admp/visitors"
            },
            {
                name: "bans",
                title: "Bans",
                link: "/admp/bans"
            }
        ];
        var renderSection = function (_a) {
            var name = _a.name, title = _a.title, _b = _a.children, children = _b === void 0 ? [] : _b, _c = _a.link, link = _c === void 0 ? "#" : _c;
            return (React__default["default"].createElement("li", { className: "nav-item ".concat(children.length ? "dropdown" : "") },
                React__default["default"].createElement("a", __assign({ className: "nav-link ".concat(currentSection === name ? "active" : "", " ").concat(children.length ? "dropdown-toggle" : ""), href: link }, (children.length ? { "data-bs-toggle": "dropdown" } : {})), title),
                children.length ? React__default["default"].createElement("ul", { className: "dropdown-menu" }, children.map(renderSection)) : null));
        };
        return (React__default["default"].createElement("nav", { className: "navbar mb-4 navbar-expand-lg navbar-light bg-light" },
            React__default["default"].createElement("div", { className: "container-fluid" },
                React__default["default"].createElement("a", { className: "navbar-brand", href: "/admp" }, "Apiker"),
                React__default["default"].createElement("button", { className: "navbar-toggler", type: "button", "data-bs-toggle": "collapse", "data-bs-target": "#navbarNavDropdown", "aria-controls": "navbarNavDropdown", "aria-expanded": "false", "aria-label": "Toggle navigation" },
                    React__default["default"].createElement("span", { className: "navbar-toggler-icon" })),
                React__default["default"].createElement("div", { className: "collapse navbar-collapse", id: "navbarNavDropdown" },
                    React__default["default"].createElement("ul", { className: "navbar-nav" }, sections.map(renderSection))),
                rateLimitMax && React__default["default"].createElement("span", { className: "text-muted", title: "Firewall RateLimit remaining/max" },
                    rateLimitRemaining,
                    "/",
                    rateLimitMax))));
    };

    var AdminPanelBanId = function (_a) {
        var currentSection = _a.currentSection, operatingId = _a.operatingId, rateLimitMax = _a.rateLimitMax, rateLimitRemaining = _a.rateLimitRemaining;
        setTimeout(function () {
            window.location.href = '/admp/bans';
        }, 2000);
        return (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement(PanelHeader, { currentSection: currentSection, rateLimitMax: rateLimitMax, rateLimitRemaining: rateLimitRemaining }),
            React__default["default"].createElement("div", { className: "container" },
                React__default["default"].createElement("div", { className: "row" },
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("p", { className: "lead d-flex justify-content-center" },
                            "Operation completed on id ",
                            operatingId))))));
    };

    var AdminPanelBans = function (_a) {
        var currentSection = _a.currentSection, latestBans = _a.latestBans, currentId = _a.currentId, rateLimitMax = _a.rateLimitMax, rateLimitRemaining = _a.rateLimitRemaining;
        return (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement(PanelHeader, { currentSection: currentSection, rateLimitMax: rateLimitMax, rateLimitRemaining: rateLimitRemaining }),
            React__default["default"].createElement("div", { className: "container" },
                React__default["default"].createElement("div", { className: "row row-cols-1 row-cols-md-3 g-4 mb-4" },
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "card text-dark bg-light mb-3", style: { maxWidth: "18rem" } },
                            React__default["default"].createElement("div", { className: "card-header" }, "Ban user"),
                            React__default["default"].createElement("div", { className: "card-body" },
                                React__default["default"].createElement("form", { className: "row d-grid gap-2", method: "post", action: "/admp/banid" },
                                    React__default["default"].createElement("div", { class: "col-auto" },
                                        React__default["default"].createElement("input", { type: "text", readonly: true, class: "form-control", name: "id", placeholder: "id" })),
                                    React__default["default"].createElement("div", { class: "col-auto d-grid gap-2" },
                                        React__default["default"].createElement("button", { type: "submit", class: "btn btn-primary mb-3" }, "Ban")))))),
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "card text-dark bg-light mb-3", style: { maxWidth: "18rem" } },
                            React__default["default"].createElement("div", { className: "card-header" }, "Unban user"),
                            React__default["default"].createElement("div", { className: "card-body" },
                                React__default["default"].createElement("form", { className: "row d-grid gap-2", method: "post", action: "/admp/banid" },
                                    React__default["default"].createElement("div", { class: "col-auto" },
                                        React__default["default"].createElement("input", { type: "text", readonly: true, class: "form-control", name: "unbanid", placeholder: "id" })),
                                    React__default["default"].createElement("div", { class: "col-auto d-grid gap-2" },
                                        React__default["default"].createElement("button", { type: "submit", class: "btn btn-primary mb-3" }, "Unban"))))))),
                React__default["default"].createElement("div", { className: "row" },
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "p-2 text-light bg-secondary" }, "Latest Bans"),
                        React__default["default"].createElement("table", { className: "table" },
                            React__default["default"].createElement("thead", null,
                                React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "col" }, "Time"),
                                    React__default["default"].createElement("th", { scope: "col" }, "ClientId"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Country"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Pathname"))),
                            React__default["default"].createElement("tbody", null, latestBans.map(function (_a) {
                                var time = _a.time, id = _a.id, countryCode = _a.countryCode, pathname = _a.pathname;
                                return (React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "row" }, new Date(time).toLocaleString()),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("div", { className: "d-flex" },
                                            React__default["default"].createElement("span", { className: "text-truncate", style: { maxWidth: 100, display: "inline-block" }, title: id }, id),
                                            " ",
                                            currentId === id && React__default["default"].createElement("span", { className: "badge bg-primary", title: "This client" }, "*"))),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("span", { title: countryCode }, getFlagEmoji(countryCode))),
                                    React__default["default"].createElement("td", null, pathname)));
                            }))))))));
    };

    var AdminPanelLogin = function (_a) {
        var hasUsers = _a.hasUsers;
        return (React__default["default"].createElement("div", { className: "m-3" }, hasUsers ? (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement("h1", { className: "display-6 mb-3" }, "Login"),
            React__default["default"].createElement("form", { className: "row g-3", method: "post", action: "/admp" },
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("label", { for: "staticEmail2", className: "visually-hidden" }, "Email"),
                    React__default["default"].createElement("input", { type: "text", className: "form-control", name: "email", placeholder: "Email" })),
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("label", { for: "inputPassword2", className: "visually-hidden" }, "Password"),
                    React__default["default"].createElement("input", { type: "password", className: "form-control", name: "password", placeholder: "Password" })),
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("button", { type: "submit", className: "btn btn-primary mb-3" }, "Confirm identity"))))) : (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement("h1", { className: "display-6 mb-3" }, "Welcome to Apiker"),
            React__default["default"].createElement("p", { className: "lead" }, "Setup your admin account in order to manage your Apiker installation."),
            React__default["default"].createElement("form", { className: "row g-3", method: "post", action: "/admp" },
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("label", { for: "staticEmail2", className: "visually-hidden" }, "Email"),
                    React__default["default"].createElement("input", { type: "text", className: "form-control", name: "email", placeholder: "Email" })),
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("label", { for: "inputPassword2", className: "visually-hidden" }, "Password"),
                    React__default["default"].createElement("input", { type: "password", className: "form-control", name: "password", placeholder: "Password" })),
                React__default["default"].createElement("div", { className: "col-auto" },
                    React__default["default"].createElement("button", { type: "submit", className: "btn btn-primary mb-3" }, "Create account")))))));
    };

    var AdminPanelDashboard = function (_a) {
        var latestBans = _a.latestBans, latestVisitors = _a.latestVisitors, allVisitorsCount = _a.allVisitorsCount, currentId = _a.currentId, rateLimitMax = _a.rateLimitMax, rateLimitRemaining = _a.rateLimitRemaining;
        return (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement(PanelHeader, { rateLimitMax: rateLimitMax, rateLimitRemaining: rateLimitRemaining }),
            React__default["default"].createElement("div", { className: "container" },
                React__default["default"].createElement("div", { className: "row" },
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "p-2 text-light bg-secondary" },
                            "Latest Visitors (",
                            allVisitorsCount,
                            ")"),
                        React__default["default"].createElement("table", { className: "table" },
                            React__default["default"].createElement("thead", null,
                                React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "col" }, "Time"),
                                    React__default["default"].createElement("th", { scope: "col" }, "ClientId"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Country"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Pathname"))),
                            React__default["default"].createElement("tbody", null, latestVisitors.map(function (_a) {
                                var time = _a.time, id = _a.id, countryCode = _a.countryCode, pathname = _a.pathname;
                                return (React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "row" }, new Date(time).toLocaleString()),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("div", { class: "d-flex" },
                                            React__default["default"].createElement("span", { className: "text-truncate", style: { maxWidth: 100, display: "inline-block" }, title: id }, id),
                                            " ",
                                            currentId === id && React__default["default"].createElement("span", { className: "badge bg-primary", title: "This client" }, "*"))),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("span", { title: countryCode }, getFlagEmoji(countryCode))),
                                    React__default["default"].createElement("td", null, pathname)));
                            }))),
                        React__default["default"].createElement("div", { className: "d-flex justify-content-center" },
                            React__default["default"].createElement("a", { href: "/admp/visitors", class: "btn btn-link" }, "View All"))),
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "p-2 text-light bg-secondary" }, "Latest Bans"),
                        React__default["default"].createElement("table", { className: "table" },
                            React__default["default"].createElement("thead", null,
                                React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "col" }, "Time"),
                                    React__default["default"].createElement("th", { scope: "col" }, "ClientId"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Country"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Pathname"))),
                            React__default["default"].createElement("tbody", null, latestBans.map(function (_a) {
                                var time = _a.time, id = _a.id, countryCode = _a.countryCode, pathname = _a.pathname;
                                return (React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "row" }, new Date(time).toLocaleString()),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("div", { class: "d-flex" },
                                            React__default["default"].createElement("span", { className: "text-truncate", style: { maxWidth: 100, display: "inline-block" }, title: id }, id),
                                            " ",
                                            currentId === id && React__default["default"].createElement("span", { className: "badge bg-primary", title: "This client" }, "*"))),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("span", { title: countryCode }, getFlagEmoji(countryCode))),
                                    React__default["default"].createElement("td", null, pathname)));
                            }))),
                        React__default["default"].createElement("div", { className: "d-flex justify-content-center" },
                            React__default["default"].createElement("a", { href: "/admp/bans", class: "btn btn-link" }, "View All")))))));
    };

    var AdminPanelPage = function (_a) {
        var latestLogins = _a.latestLogins, currentId = _a.currentId;
        return (React__default["default"].createElement("div", { class: "m-3" },
            React__default["default"].createElement("h1", { className: "display-6 mb-3" }, latestLogins.length ? "Welcome back" : "Welcome"),
            React__default["default"].createElement("p", { className: "lead" }, "Latest admin-login events:"),
            React__default["default"].createElement("div", null,
                React__default["default"].createElement("table", { className: "table" },
                    React__default["default"].createElement("thead", null,
                        React__default["default"].createElement("tr", null,
                            React__default["default"].createElement("th", { scope: "col" }, "Time"),
                            React__default["default"].createElement("th", { scope: "col" }, "ClientId"),
                            React__default["default"].createElement("th", { scope: "col" }, "Country"),
                            React__default["default"].createElement("th", { scope: "col" }, "Pathname"))),
                    React__default["default"].createElement("tbody", null, latestLogins.map(function (_a) {
                        var time = _a.time, id = _a.id, countryCode = _a.countryCode, pathname = _a.pathname;
                        return (React__default["default"].createElement("tr", null,
                            React__default["default"].createElement("th", { scope: "row" }, new Date(time).toLocaleString()),
                            React__default["default"].createElement("td", null,
                                React__default["default"].createElement("div", { class: "d-flex" },
                                    React__default["default"].createElement("span", { className: "text-truncate", style: { maxWidth: 100, display: "inline-block" }, title: id }, id),
                                    " ",
                                    currentId === id && React__default["default"].createElement("span", { className: "badge bg-primary", title: "This client" }, "*"))),
                            React__default["default"].createElement("td", null,
                                React__default["default"].createElement("span", { title: countryCode }, getFlagEmoji(countryCode))),
                            React__default["default"].createElement("td", null, pathname)));
                    }))),
                React__default["default"].createElement("a", { href: "/admp/dashboard", class: "btn btn-primary" }, "Continue to Dashboard"))));
    };

    var AdminPanelVisitors = function (_a) {
        var currentSection = _a.currentSection, latestVisitors = _a.latestVisitors, currentId = _a.currentId, rateLimitMax = _a.rateLimitMax, rateLimitRemaining = _a.rateLimitRemaining;
        return (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement(PanelHeader, { currentSection: currentSection, rateLimitMax: rateLimitMax, rateLimitRemaining: rateLimitRemaining }),
            React__default["default"].createElement("div", { className: "container" },
                React__default["default"].createElement("div", { className: "row" },
                    React__default["default"].createElement("div", { className: "col" },
                        React__default["default"].createElement("div", { className: "p-2 text-light bg-secondary" }, "Latest Visitors"),
                        React__default["default"].createElement("table", { className: "table" },
                            React__default["default"].createElement("thead", null,
                                React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "col" }, "Time"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Id"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Country"),
                                    React__default["default"].createElement("th", { scope: "col" }, "Pathname"))),
                            React__default["default"].createElement("tbody", null, latestVisitors.map(function (_a) {
                                var time = _a.time, id = _a.id, countryCode = _a.countryCode, pathname = _a.pathname;
                                return (React__default["default"].createElement("tr", null,
                                    React__default["default"].createElement("th", { scope: "row" }, new Date(time).toLocaleString()),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("div", { class: "d-flex" },
                                            React__default["default"].createElement("span", { className: "text-truncate", style: { maxWidth: 100, display: "inline-block" }, title: id }, id),
                                            " ",
                                            currentId === id && React__default["default"].createElement("span", { className: "badge bg-primary", title: "This client" }, "*"))),
                                    React__default["default"].createElement("td", null,
                                        React__default["default"].createElement("span", { title: countryCode }, getFlagEmoji(countryCode))),
                                    React__default["default"].createElement("td", null, pathname)));
                            }))))))));
    };

    var pages = {
        AdminPanelPage: AdminPanelPage,
        AdminPanelLogin: AdminPanelLogin,
        AdminPanelDashboard: AdminPanelDashboard,
        AdminPanelVisitors: AdminPanelVisitors,
        AdminPanelBans: AdminPanelBans,
        AdminPanelBanId: AdminPanelBanId
    };

    return pages;

})(React, null, cryptojs, bcrypt);`
