import { Handler } from '../Request';
import React from "react";
import { wrapReactPage } from '../Page';
import { User } from '../Auth';
import { OBN } from '../ObjectBase';

export const adminPanelLogin: Handler = async ({ state }) => {
  const latestRequests = await state(OBN.USERS).list({ limit: 1 });
  const firstUser = Object.values(latestRequests)[0] as User;
  const hasUsers = !!firstUser?.id;
  const props = { hasUsers };

  return wrapReactPage('AdminPanelLogin', AdminPanelLogin, props);
}

export const AdminPanelLogin: React.FC = ({ hasUsers }) => {
  return (
    <div className="m-3">
      {hasUsers ? (
        <React.Fragment>
          <h1 className="display-6 mb-3">Login</h1>
          <form className="row g-3" method="post" action="/admp">
            <div className="col-auto">
                <label for="staticEmail2" className="visually-hidden">Email</label>
                <input type="text" className="form-control" name="email" placeholder="Email" />
            </div>
            <div className="col-auto">
                <label for="inputPassword2" className="visually-hidden">Password</label>
                <input type="password" className="form-control" name="password" placeholder="Password" />
            </div>
            <div className="col-auto">
                <button type="submit" className="btn btn-primary mb-3">Confirm identity</button>
            </div>
          </form>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <h1 className="display-6 mb-3">Welcome to Apiker</h1>
          <p className="lead">
            Setup your admin account in order to manage your Apiker installation.
          </p>
          <form className="row g-3" method="post" action="/admp">
            <div className="col-auto">
                <label for="staticEmail2" className="visually-hidden">Email</label>
                <input type="text" className="form-control" name="email" placeholder="Email" />
            </div>
            <div className="col-auto">
                <label for="inputPassword2" className="visually-hidden">Password</label>
                <input type="password" className="form-control" name="password" placeholder="Password" />
            </div>
            <div className="col-auto">
                <button type="submit" className="btn btn-primary mb-3">Create account</button>
            </div>
          </form>
        </React.Fragment>
      )}
    </div>
  )
};
