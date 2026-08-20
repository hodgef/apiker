import cookie from "cookie";
import { apiker } from '../../Apiker';
import { Handler } from '../../Request';
import { res_200 } from '../../Response';

/** Clears the session cookie `loginEndpoint` sets, ending the admin's session. */
export const logoutEndpoint: Handler = async () => {
  apiker.responseHeaders.set('Set-Cookie', cookie.serialize('apikerToken', '', {
    sameSite: true,
    httpOnly: true,
    secure: true,
    maxAge: 0
  }));

  return res_200();
};
