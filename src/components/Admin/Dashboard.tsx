import { Handler } from '../Request';
import React from "react";
import { getFlagEmoji, wrapReactPage } from '../Page';
import { getCurrentUser, getSignedIp } from '../Auth';
import { adminPanelLogin } from './Login';
import { PanelHeader } from './Header';
import { getAllLogEntries, getLogEntries, LogObject } from '../Logging';
import { getBannedSignedIPs } from '../Bans';
import { FIREWALL_RATELIMIT_PREFIX } from '../Firewall';
import { OBN } from '../ObjectBase';
import { apiker } from '../Apiker';

export const adminPanelDashboard: Handler = async (params) => {
  const user = await getCurrentUser();
 
  if(!user){
    return adminPanelLogin(params);
  }

  const latestBans = (await getBannedSignedIPs()).sort((a, b) => b.time - a.time);
  const latestVisitors = (await getLogEntries(FIREWALL_RATELIMIT_PREFIX, 5, OBN.RATELIMIT)).sort((a, b) => b.time - a.time);
  const allVisitorsCount = (await getAllLogEntries(OBN.RATELIMIT)).length;
  const currentId = getSignedIp();
  const rateLimitMax = apiker.responseHeaders.get("X-RateLimit-Limit");
  const rateLimitRemaining = apiker.responseHeaders.get("X-RateLimit-Remaining");

  const props = { latestBans, latestVisitors, allVisitorsCount, currentId, rateLimitMax, rateLimitRemaining };
  return wrapReactPage('AdminPanelDashboard', AdminPanelDashboard, props);
}

export const AdminPanelDashboard: React.FC = ({ latestBans, latestVisitors, allVisitorsCount, currentId, rateLimitMax, rateLimitRemaining }) => {
  return (
    <React.Fragment>
      <PanelHeader rateLimitMax={rateLimitMax} rateLimitRemaining={rateLimitRemaining} />
      <div className="container">
        <div className="row">
        <div className="col">
            <div className="p-2 text-light bg-secondary">Latest Visitors ({allVisitorsCount})</div>
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
            <div className="d-flex justify-content-center"><a href="/admp/visitors" class="btn btn-link">View All</a></div>
          </div>
          <div className="col">
            <div className="p-2 text-light bg-secondary">Latest Bans</div>
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
                {latestBans.map(({ time, id, countryCode, pathname }: LogObject) => {
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
            <div className="d-flex justify-content-center"><a href="/admp/bans" class="btn btn-link">View All</a></div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
};
