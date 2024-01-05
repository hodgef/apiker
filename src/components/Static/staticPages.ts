export const apikerPagesStatic = `var pages = (function (React, ReactDOMServer, cryptojs, bcrypt, ReactDOM) {
  'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
  var cryptojs__default = /*#__PURE__*/_interopDefaultLegacy(cryptojs);
  var bcrypt__default = /*#__PURE__*/_interopDefaultLegacy(bcrypt);
  var ReactDOM__default = /*#__PURE__*/_interopDefaultLegacy(ReactDOM);

  /******************************************************************************
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

  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  cryptojs__default["default"]();
  bcrypt__default["default"]();

  var defaultActions = [
      {
          id: "login",
          displayName: "Login"
      }
  ];
  var authActions = [
      {
          id: "banUser",
          displayName: "Ban User"
      },
      {
          id: "unbanUser",
          displayName: "Unban User"
      },
      {
          id: "searchBans",
          displayName: "Search Bans"
      }
  ];

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

  var getAppHelper = function (pageName) { var _a; return ((_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.initializeAppHelper) === null || _a === void 0 ? void 0 : _a.call(globalThis, pageName)) || {}; };

  var Login = function (props) {
      var isSetup = props.isSetup, _a = props.pageName, pageName = _a === void 0 ? "" : _a, _b = props.csrfToken, csrfToken = _b === void 0 ? "" : _b;
      var setProps = getAppHelper(pageName).setProps;
      var onSubmit = function () {
          var formData = new FormData();
          Array.from(document.querySelectorAll("input")).forEach(function (input) {
              var key = input.getAttribute("id");
              formData.append(key, input.value);
          });
          fetch('/admp/login', {
              method: 'post',
              body: formData,
              headers: { "X-Apiker-Csrf": csrfToken }
          })
              .then(function (r) { return r.json().then(function (res) { return ({ status: r.status, body: res }); }); })
              .then(function (data) {
              var status = data.status;
              var isSucessful = status === 200;
              var action = isSucessful ? undefined : props.action;
              var message = isSucessful ? "Sucess! You can now select a new action" : "Failure returned by the endpoint.";
              setProps(__assign(__assign({}, props), { action: action, actions: authActions, dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message: message } }));
          })
              .catch(function (error) {
              setProps(__assign(__assign({}, props), { dialog: { className: "alert-danger", message: error === null || error === void 0 ? void 0 : error.message } }));
          });
      };
      return (React__default["default"].createElement("div", { className: "action-wrapper" },
          isSetup && (React__default["default"].createElement("div", { className: "alert alert-primary mb-0", role: "alert" }, "Welcome to Apiker! Please setup your account in order to manage your app.")),
          React__default["default"].createElement("form", { className: "login-form", onSubmit: onSubmit },
              React__default["default"].createElement("input", { className: "form-control form-control-lg mt-2", id: "email", type: "email", placeholder: "Email" }),
              React__default["default"].createElement("input", { className: "form-control form-control-lg mt-2", id: "password", type: "password", placeholder: "Password" }),
              React__default["default"].createElement("button", { className: "btn btn-primary mt-2 action-btn", type: "submit" }, isSetup ? "Setup User" : "Submit"))));
  };

  var Dialog = function (props) {
      var dialog = props.dialog, _a = props.pageName, pageName = _a === void 0 ? "" : _a;
      var _b = dialog || {}, className = _b.className, message = _b.message;
      var setProps = getAppHelper(pageName).setProps;
      var onClose = function () {
          setProps(__assign(__assign({}, props), { dialog: undefined }));
      };
      return (React__default["default"].createElement("div", null,
          React__default["default"].createElement("div", { className: "alert ".concat(className, " mt-0 mb-0 alert-dismissible fade show"), role: "alert" },
              React__default["default"].createElement("strong", null, "Status:"),
              " ",
              message,
              React__default["default"].createElement("button", { type: "button", className: "btn-close", onClick: onClose }))));
  };

  var BanUser = function (props) {
      var _a = props.pageName, pageName = _a === void 0 ? "" : _a, _b = props.csrfToken, csrfToken = _b === void 0 ? "" : _b;
      var setProps = getAppHelper(pageName).setProps;
      var onSubmit = function () {
          var formData = new FormData();
          Array.from(document.querySelectorAll("input")).forEach(function (input) {
              var key = input.getAttribute("id");
              formData.append(key, input.value);
          });
          fetch('/admp/bans', {
              method: 'post',
              body: formData,
              headers: { "X-Apiker-Csrf": csrfToken }
          })
              .then(function (r) { return r.json().then(function (res) { return ({ status: r.status, body: res }); }); })
              .then(function (data) {
              var status = data.status;
              var isSucessful = status === 200;
              var message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";
              setProps(__assign(__assign({}, props), { dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message: message } }));
          })
              .catch(function (error) {
              setProps(__assign(__assign({}, props), { dialog: { className: "alert-danger", message: error === null || error === void 0 ? void 0 : error.message } }));
          });
      };
      return (React__default["default"].createElement("div", { className: "action-wrapper" },
          React__default["default"].createElement("form", { className: "login-form", onSubmit: onSubmit },
              React__default["default"].createElement("input", { className: "form-control form-control-lg mt-2", id: "userId", type: "text", placeholder: "User ID" }),
              React__default["default"].createElement("button", { className: "btn btn-primary mt-2 action-btn", type: "submit" }, "Submit"))));
  };

  var UnbanUser = function (props) {
      var _a = props.pageName, pageName = _a === void 0 ? "" : _a, _b = props.csrfToken, csrfToken = _b === void 0 ? "" : _b;
      var setProps = getAppHelper(pageName).setProps;
      var onSubmit = function () {
          var formData = new FormData();
          Array.from(document.querySelectorAll("input")).forEach(function (input) {
              var key = input.getAttribute("id");
              formData.append(key, input.value);
          });
          fetch('/admp/bans', {
              method: 'delete',
              body: formData,
              headers: { "X-Apiker-Csrf": csrfToken }
          })
              .then(function (r) { return r.json().then(function (res) { return ({ status: r.status, body: res }); }); })
              .then(function (data) {
              var status = data.status;
              var isSucessful = status === 200;
              var message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";
              setProps(__assign(__assign({}, props), { dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message: message } }));
          })
              .catch(function (error) {
              setProps(__assign(__assign({}, props), { dialog: { className: "alert-danger", message: error === null || error === void 0 ? void 0 : error.message } }));
          });
      };
      return (React__default["default"].createElement("div", { className: "action-wrapper" },
          React__default["default"].createElement("form", { className: "login-form", onSubmit: onSubmit },
              React__default["default"].createElement("input", { className: "form-control form-control-lg mt-2", id: "userId", type: "text", placeholder: "User ID" }),
              React__default["default"].createElement("button", { className: "btn btn-primary mt-2 action-btn", type: "submit" }, "Submit"))));
  };

  var SearchBans = function (props) {
      var _a = props.pageName, pageName = _a === void 0 ? "" : _a, _b = props.csrfToken, csrfToken = _b === void 0 ? "" : _b;
      var setProps = getAppHelper(pageName).setProps;
      var _c = React__default["default"].useState([]), results = _c[0], setResults = _c[1];
      var onSubmit = function () {
          var data = {};
          Array.from(document.querySelectorAll("input")).forEach(function (input) {
              var key = input.getAttribute("id");
              data[key] = input.value;
          });
          if (!data.userId) {
              setProps(__assign(__assign({}, props), { dialog: { className: "alert-danger", message: "You must provide an user id" } }));
          }
          fetch("/admp/bans/".concat(data.userId), {
              method: 'get',
              headers: { "X-Apiker-Csrf": csrfToken }
          })
              .then(function (r) { return r.json().then(function (res) { return ({ status: r.status, body: res }); }); })
              .then(function (data) {
              var status = data.status, _a = data.body, body = _a === void 0 ? {} : _a;
              var _b = body.entries, entries = _b === void 0 ? [] : _b;
              var isSucessful = status === 200;
              var mappedEntries = entries.map(function (_a) {
                  var time = _a.time, id = _a.id, clientId = _a.clientId, countryCode = _a.countryCode, pathname = _a.pathname, issuedBy = _a.issuedBy;
                  return ({
                      time: time,
                      id: id,
                      clientId: clientId,
                      countryCode: countryCode,
                      pathname: pathname,
                      issuedBy: issuedBy
                  });
              });
              var message = isSucessful ? "Action performed successfully" : "Failure returned by the endpoint.";
              setProps(__assign(__assign({}, props), { dialog: { className: isSucessful ? "alert-primary" : "alert-danger", message: message } }));
              setResults(mappedEntries);
          })
              .catch(function (error) {
              setProps(__assign(__assign({}, props), { dialog: { className: "alert-danger", message: error === null || error === void 0 ? void 0 : error.message } }));
          });
      };
      return (React__default["default"].createElement("div", { className: "action-wrapper" },
          React__default["default"].createElement("form", { className: "login-form", onSubmit: onSubmit },
              React__default["default"].createElement("input", { className: "form-control form-control-lg mt-2", id: "userId", type: "text", placeholder: "User ID" }),
              React__default["default"].createElement("button", { className: "btn btn-primary mt-2 action-btn", type: "submit" }, "Submit")),
          (results && results.length) ? results.map(function (_a) {
              var time = _a.time, id = _a.id, clientId = _a.clientId, countryCode = _a.countryCode, pathname = _a.pathname, issuedBy = _a.issuedBy;
              return (React__default["default"].createElement("div", { className: "results-container" },
                  React__default["default"].createElement("div", { className: "results-item" },
                      React__default["default"].createElement("ul", null,
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "time"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: new Date(time).toLocaleString() }, new Date(time).toLocaleString())),
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "id"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: id }, id)),
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "clientId"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: clientId }, clientId)),
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "countryCode"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: countryCode }, countryCode)),
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "pathname"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: pathname }, pathname)),
                          React__default["default"].createElement("li", null,
                              React__default["default"].createElement("span", { className: "title" }, "issuedBy"),
                              " ",
                              React__default["default"].createElement("span", { className: "text", title: issuedBy }, issuedBy))))));
          }) : null));
  };

  var actionsComponent = {
      login: Login,
      banUser: BanUser,
      unbanUser: UnbanUser,
      searchBans: SearchBans
  };
  var AdminPanelPage = function (props) {
      var userSignedIp = props.userSignedIp, isAdminLoggedIn = props.isAdminLoggedIn, action = props.action, _a = props.actions, actions = _a === void 0 ? defaultActions : _a, dialog = props.dialog, _b = props.pageName, pageName = _b === void 0 ? "" : _b;
      var setProps = getAppHelper(pageName).setProps;
      var ActionComponent = action ? actionsComponent[action.id] : null;
      if (isAdminLoggedIn) {
          actions = authActions;
      }
      var onDropdownItemClick = function (action) {
          setProps(__assign(__assign({}, props), { action: action, dialog: undefined }));
      };
      var actionDropdown = (React__default["default"].createElement("div", { className: "btn-group" },
          React__default["default"].createElement("button", { className: "btn btn-transparent btn-lg dropdown-toggle action-dropdown", type: "button", id: "main-dropdown", "data-bs-toggle": "dropdown", "aria-expanded": "false" }, action ? action.displayName : "Select action"),
          React__default["default"].createElement("ul", { className: "dropdown-menu", "aria-labelledby": "main-dropdown" }, actions.map(function (currentAction) {
              var id = currentAction.id, displayName = currentAction.displayName;
              return (React__default["default"].createElement("li", { key: id },
                  React__default["default"].createElement("a", { className: "dropdown-item", href: "#", onClick: function () { return onDropdownItemClick(currentAction); } }, displayName)));
          }))));
      return (React__default["default"].createElement(React__default["default"].Fragment, null,
          React__default["default"].createElement(Header, null, dialog && React__default["default"].createElement(Dialog, __assign({}, props))),
          React__default["default"].createElement(Content, null,
              actionDropdown,
              ActionComponent && React__default["default"].createElement(ActionComponent, __assign({}, props)),
              userSignedIp && React__default["default"].createElement("div", { className: "signed-ip" },
                  "Your ID: ",
                  userSignedIp))));
  };

  var pages = {
      AdminPanelPage: AdminPanelPage,
      ReactDOM: ReactDOM__default["default"]
  };

  return pages;

})(React, null, function(){}, function(){}, ReactDOM);`;
