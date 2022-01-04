import { Handler } from '../Request';
import React from "react";
import { getFlagEmoji, wrapReactPage } from '../Page';
import { getCurrentUser, getSignedIp } from '../Auth';
import { adminPanelLogin } from './Login';
import { PanelHeader } from './Header';
import { getLogEntries, LogObject } from '../Logging';
import { FIREWALL_RATELIMIT_PREFIX } from '../Firewall';
import { OBN } from '../ObjectBase';
import { apiker } from '../Apiker';

export const adminPanelVisitors: Handler = async (params) => {
  const currentSection = "visitors";
  const user = await getCurrentUser();
 
  if(!user){
    return adminPanelLogin(params);
  }

  const latestVisitors = (await getLogEntries(FIREWALL_RATELIMIT_PREFIX, 50, OBN.RATELIMIT)).sort((a, b) => b.time - a.time);
  const currentId = getSignedIp();
  const rateLimitMax = apiker.responseHeaders.get("X-RateLimit-Limit");
  const rateLimitRemaining = apiker.responseHeaders.get("X-RateLimit-Remaining");

  const props = { currentSection, latestVisitors, currentId, rateLimitMax, rateLimitRemaining };
  return wrapReactPage('AdminPanelVisitors', AdminPanelVisitors, props);
}

export const AdminPanelVisitors: React.FC = ({ currentSection, latestVisitors, currentId, rateLimitMax, rateLimitRemaining }) => {
  return (
    <React.Fragment>
      <PanelHeader currentSection={currentSection} rateLimitMax={rateLimitMax} rateLimitRemaining={rateLimitRemaining} />
      <div className="container">
        <div className="row">
        <div className="col">
            <div className="p-2 text-light bg-secondary">Latest Visitors</div>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Id</th>
                  <th scope="col">Country</th>
                  <th scope="col">Pathname</th>
                </tr>
              </thead>
              <tbody>
                {latestVisitors.map(({ time, id, countryCode, pathname }: LogObject) => {
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
          </div>
        </div>
      </div>
    </React.Fragment>
  )
};
