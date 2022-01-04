import { Handler } from '../Request';
import React from "react";
import { wrapReactPage } from '../Page';
import { PanelHeader } from './Header';
import { apiker } from '../Apiker';
import { res_404 } from '..';
import { banSignedIP, unbanSignedIP } from '../Bans';

export const adminPanelBanId: Handler = async (params) => {
  const currentSection = "bans";
  const rateLimitMax = apiker.responseHeaders.get("X-RateLimit-Limit");
  const rateLimitRemaining = apiker.responseHeaders.get("X-RateLimit-Remaining");

  const { body } = params;
  const { id: bannedId, unbanid: unbannedId } = body || {};

  if(!(bannedId || unbannedId)){
    return res_404();
  }

  if(bannedId){
    await banSignedIP(bannedId);
  } else if(unbannedId){
    await unbanSignedIP(unbannedId);
  }

  const operatingId = bannedId || unbannedId;
  
  const props = { operatingId, currentSection, rateLimitMax, rateLimitRemaining };
  return wrapReactPage('AdminPanelBanId', AdminPanelBanId, props);
}

export const AdminPanelBanId: React.FC = ({ currentSection, operatingId, rateLimitMax, rateLimitRemaining }) => {
  setTimeout(() => {
    window.location.href = '/admp/bans';
  }, 2000);

  return (
    <React.Fragment>
      <PanelHeader currentSection={currentSection} rateLimitMax={rateLimitMax} rateLimitRemaining={rateLimitRemaining} />
      <div className="container">
        <div className="row">
          <div className="col">
            <p className="lead d-flex justify-content-center">
              Operation completed on id {operatingId}
            </p>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
};
