import { Handler } from '../Request';
import React from "react";
import { getFlagEmoji, wrapReactPage } from '../Page';
import { checkUser, getCurrentUser, getSignedIp, getTokens, isUserAdmin, registerUserAction, User } from '../Auth';
import { OBN } from '../ObjectBase';
import cookie from "cookie"
import { adminPanelLogin } from './Login';
import { apiker } from '../Apiker';
import { addLogEntry, getLogEntries, LogObject } from '../Logging';
import { ADMIN_LOGIN_PREFIX } from './constants';
import { res_401 } from '../Response';

export const adminPanelSetup: Handler = async (params) => {
  const { state, body } = params;
  const { email, password } = body || {};
  let user: User | undefined;

  /**
   * If there's an user, it's a login, otherwise it's a registration
   */
  if(email && password){
    const adminIds = await state(OBN.COMMON).get("adminIds");
    const hasAdmins = !!adminIds?.length;
    
    if(hasAdmins) {
      user = await checkUser(email, password);
    } else {
      user = await registerUserAction(email, password, { role: "admin" });
    }

    if(user && await isUserAdmin(user.id)){
      const { token } = getTokens(user?.id, 60);
      apiker.responseHeaders.set('Set-Cookie', cookie.serialize('apikerToken', `Bearer ${token}`, {
        sameSite: true,
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 // 1 hr
      }));

      /**
       * Add log entry
       */
      await addLogEntry(ADMIN_LOGIN_PREFIX);
    }
  } else {
    user = await getCurrentUser();
  }
 
  if(!user){
    return adminPanelLogin(params);
  }

  if(!await isUserAdmin(user.id)){
    return res_401();
  }

  const latestLogins = (await getLogEntries(ADMIN_LOGIN_PREFIX, 5)).sort((a, b) => b.time - a.time);
  const currentId = getSignedIp();
  const props = { latestLogins, currentId };

  return wrapReactPage('AdminPanelPage', AdminPanelPage, props)
}

export const AdminPanelPage: React.FC = ({ latestLogins, currentId }) => {
  return (
    <div class="m-3">
      <h1 className="display-6 mb-3">{latestLogins.length ? "Welcome back": "Welcome"}</h1>
      <p className="lead">
        Latest admin-login events:
      </p>
      <div>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">ClientId</th>
              <th scope="col">Country</th>
              <th scope="col">Pathname</th>
            </tr>
          </thead>
          <tbody>
            {latestLogins.map(({ time, id, countryCode, pathname }: LogObject) => {
              return (
                <tr>
                  <th scope="row">{new Date(time).toLocaleString()}</th>
                  <td><div class="d-flex"><span className="text-truncate" style={{ maxWidth: 100, display: "inline-block" }} title={id}>{id}</span> {currentId === id && <span className="badge bg-primary" title="This client">*</span>}</div></td>
                  <td><span title={countryCode}>{getFlagEmoji(countryCode)}</span></td>
                  <td>{pathname}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <a href="/admp/dashboard" class="btn btn-primary">Continue to Dashboard</a>
      </div>
    </div>
  )
};