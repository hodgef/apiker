export const apikerPagesStatic = `var pages = (function (pathToRegexp, React, ReactDOMServer, cryptojs, bcrypt) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
    var cryptojs__default = /*#__PURE__*/_interopDefaultLegacy(cryptojs);
    var bcrypt__default = /*#__PURE__*/_interopDefaultLegacy(bcrypt);

    cryptojs__default["default"]();
    bcrypt__default["default"]();

    var img = "data:image/svg+xml,%3c%3fxml version='1.0' encoding='UTF-8'%3f%3e%3csvg id='Layer_2' data-name='Layer 2' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6.66 7.35'%3e %3cdefs%3e %3cstyle%3e .cls-1 %7b fill: %232e3191%3b %7d %3c/style%3e %3c/defs%3e %3cg id='Layer_23' data-name='Layer 23'%3e %3cpath class='cls-1' d='m3.2%2c0h.13l3.33%2c7.35H0L3.2%2c0Zm1.01%2c5.27l-.52-1.26c-.21-.51-.44-1.31-.44-1.31%2c0%2c0-.21.79-.43%2c1.31l-.52%2c1.26h1.92Z'/%3e %3c/g%3e%3c/svg%3e";

    var Header = function (_a) {
        var _b = _a === void 0 ? {} : _a, children = _b.children;
        return (React__default["default"].createElement("nav", { className: "navbar navbar-expand-lg navbar-light px-3" },
            React__default["default"].createElement("a", { className: "navbar-brand", href: "#" },
                React__default["default"].createElement("img", { src: img, height: "59", width: "52" })),
            children));
    };

    var Content = function (_a) {
        var _b = _a === void 0 ? {} : _a, children = _b.children;
        return (React__default["default"].createElement("div", { className: "content mt-5" },
            React__default["default"].createElement("div", { className: "container" },
                React__default["default"].createElement("div", { className: "row justify-content-md-center" },
                    React__default["default"].createElement("div", { className: "col-lg-6" }, children)))));
    };

    var actions = [
        {
            id: "login",
            displayName: "Login"
        }
    ];
    var AdminPanelPage = function () {
        var _a = React__default["default"].useState(); _a[0]; var setAction = _a[1];
        var onDropdownItemClick = function (id) {
            console.log("click");
            setAction(id);
        };
        var dropdown = (React__default["default"].createElement("div", { className: "btn-group" },
            React__default["default"].createElement("button", { className: "btn btn-transparent btn-lg dropdown-toggle action-dropdown", type: "button", id: "main-dropdown", "data-bs-toggle": "dropdown", "aria-expanded": "false" }, "Test"),
            React__default["default"].createElement("ul", { className: "dropdown-menu", "aria-labelledby": "main-dropdown" }, actions.map(function (_a) {
                var id = _a.id, displayName = _a.displayName;
                return (React__default["default"].createElement("li", { key: id },
                    React__default["default"].createElement("a", { className: "dropdown-item", href: "#", onClick: function () { return onDropdownItemClick(id); } }, displayName)));
            }))));
        return (React__default["default"].createElement(React__default["default"].Fragment, null,
            React__default["default"].createElement(Header, null),
            React__default["default"].createElement(Content, null, dropdown)));
    };

    var pages = {
        AdminPanelPage: AdminPanelPage
    };

    return pages;

})(null, React, null, function(){}, function(){});`;
