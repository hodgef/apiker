import { Handler } from '../Request';
import React from "react";
import { getFlagEmoji, wrapReactPage } from '../Page';
import { getSignedIp } from '../Auth';
import { PanelHeader } from './Header';
import { LogObject } from '../Logging';
import { getBannedSignedIPs } from '../Bans';
import { apiker } from '../Apiker';

export const adminPanelBans: Handler = async (params) => {
  const currentSection = "bans";

  const latestBans = (await getBannedSignedIPs(50)).sort((a, b) => b.time - a.time);
  const currentId = getSignedIp();
  const rateLimitMax = apiker.responseHeaders.get("X-RateLimit-Limit");
  const rateLimitRemaining = apiker.responseHeaders.get("X-RateLimit-Remaining");

  const props = { currentSection, latestBans, currentId, rateLimitMax, rateLimitRemaining };
  return wrapReactPage('AdminPanelBans', AdminPanelBans, props);
}

export const AdminPanelBans: React.FC = ({ currentSection, latestBans, currentId, rateLimitMax, rateLimitRemaining }) => {
  return (
    <React.Fragment>
      <PanelHeader currentSection={currentSection} rateLimitMax={rateLimitMax} rateLimitRemaining={rateLimitRemaining} />
      <div className="container">
        <div className="row row-cols-1 row-cols-md-3 g-4 mb-4">
          <div className="col">
            <div className="card text-dark bg-light mb-3" style={{ maxWidth: "18rem" }}>
              <div className="card-header">Ban user</div>
              <div className="card-body">
                <form className="row d-grid gap-2" method="post" action="/admp/banid">
                  <div class="col-auto">
                    <input type="text" readonly class="form-control" name="id" placeholder="id" />
                  </div>
                  <div class="col-auto d-grid gap-2">
                    <button type="submit" class="btn btn-primary mb-3">Ban</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card text-dark bg-light mb-3" style={{ maxWidth: "18rem" }}>
              <div className="card-header">Unban user</div>
              <div className="card-body">
                <form className="row d-grid gap-2" method="post" action="/admp/banid">
                  <div class="col-auto">
                    <input type="text" readonly class="form-control" name="unbanid" placeholder="id" />
                  </div>
                  <div class="col-auto d-grid gap-2">
                    <button type="submit" class="btn btn-primary mb-3">Unban</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
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
                      <td><div className="d-flex"><span className="text-truncate" style={{ maxWidth: 100, display: "inline-block" }} title={id}>{id}</span> {currentId === id && <span className="badge bg-primary" title="This client">*</span>}</div></td>
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
