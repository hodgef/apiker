import { Handler } from '../Request';
import React from "react";
import { wrapReactPage } from '../Page';
import { getCurrentUser } from '../Auth';
import { adminPanelLogin } from './Login';
import { PanelHeader } from './Header';

export const adminPanelDashboard: Handler = async (params) => {
  const { state, headers } = params;
  const user = await getCurrentUser(headers, state);
 
  if(!user){
    return adminPanelLogin(params);
  }
  
  const props = {};
  return wrapReactPage('AdminPanelDashboard', AdminPanelDashboard, props);
}

export const AdminPanelDashboard: React.FC = () => {
  return (
    <React.Fragment>
      <PanelHeader />
      <h1 className="display-5 mb-3">Dashboard</h1>
    </React.Fragment>
  )
};
