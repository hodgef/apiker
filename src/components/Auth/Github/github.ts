import { apiker } from "../../Apiker";
import { Handler } from "../../Request";
import { res_201, res_400, res_401, res_500 } from "../../Response";

/**
 * Keys
 */
export const getKeys = (): { [key: string]: string } => {
    const keys = {
        client_id: apiker.env.GITHUB_CLIENT_ID,
        client_secret: apiker.env.GITHUB_CLIENT_SECRET
    }

    if(!Object.values(keys).every(value => !!value)){
        throw new Error("env.GITHUB_CLIENT_ID or env.GITHUB_CLIENT_SECRET is undefined. Please consult the documentation");
    } else {
        return keys;
    }
}

/**
 * Step 1: Authorize
 */
export const authorize: Handler = () => {
    const { client_id } = getKeys();
    const endpoint = `https://github.com/login/oauth/authorize?client_id=${client_id}`;
    return Response.redirect(endpoint, 302);
}

/**
 * Step 2: Callback fired after Authorize. Contains "code" QSP
 */
export const callback: Handler = async ({ request }) => {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    const code = params.get("code");

    if(!code) {
        return res_400();
    }

    const { client_id, client_secret } = getKeys();

    try {
        /**
         * Get token
         */
        const response = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "User-Agent": "apiker",
                },
                body: JSON.stringify({ client_id, client_secret, code }),
            }
        );

        const result = await response.json();

        if (result.error) {
            return res_401(result);
        }

        const token = result.access_token;

        /**
         * Get user
         */
        const userResponse = await fetch(
            "https://api.github.com/user",
            {
                method: "GET",
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "Authorization": `token ${token}`,
                    "User-Agent": "apiker",
                }
            }
        );

        const userResult = await userResponse.json();

        if (userResult.error) {
            return res_401(userResult);
        }

        const client_redir = apiker.env.GITHUB_CLIENT_REDIR;
        
        if(client_redir){
            const endpoint = `${client_redir}?t=${result.access_token}&u=${userResult.login}`;
            return Response.redirect(endpoint, 302);
        } else {
            return res_201({
                token: result.access_token,
                username: userResult.login
            });
        }
    } catch (error) {
        console.error(error);
        return res_500();
    }
}