import { getSignedIp } from "../Auth";
import { apiker } from "../Apiker";
import { FIREWALL_ENDPOINT } from "./constants";

export const firewallBanIP = async (ip: string) => {
    if(!ip){
        return;
    }

    if(!apiker.env.CLOUDFLARE_WAF_KEY){
        throw new Error("CLOUDFLARE_WAF_KEY must be defined in the env when using firewall: true. Please consult the documentation");
    }

    await fetch(FIREWALL_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
            mode:"block",
            configuration:
            { target:"ip",value: ip },
            notes: `Banned by Apiker. id: ${getSignedIp()}`
        }),
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiker.env.CLOUDFLARE_WAF_KEY}`
        },
    });
};

export const getFirewallBannedEntryId = async (ip: string): Promise<string> => {
    if(!ip){
        return "";
    }

    if(!apiker.env.CLOUDFLARE_WAF_KEY){
        throw new Error("CLOUDFLARE_WAF_KEY must be defined in the env when using firewall: true. Please consult the documentation");
    }

    const result = await fetch(FIREWALL_ENDPOINT + new URLSearchParams({
        mode: "block",
        "configuration.target": "ip",
        "configuration.value": ip
    } as Record<string, string>), {
        method: "GET",
        headers: {
            Authorization: `Bearer ${apiker.env.CLOUDFLARE_WAF_KEY}`
        },
    });

    if(apiker.debug){
        console.log("getFirewallBannedEntryId", result);
    }

    return result?.[0]?.id || "";
};

export const firewallUnbanIP = async (ip: string) => {
    if(!ip){
        return;
    }
    
    if(!apiker.env.CLOUDFLARE_WAF_KEY){
        throw new Error("CLOUDFLARE_WAF_KEY must be defined in the env when using firewall: true. Please consult the documentation");
    }

    const entryId = await getFirewallBannedEntryId(ip);

    if(!entryId) {
       if(apiker.debug){
            console.log("firewallUnbanIP", "No entry found for ip", ip);
       }
        return;
    }

    const result = await fetch(`${FIREWALL_ENDPOINT}/${entryId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${apiker.env.CLOUDFLARE_WAF_KEY}`
        },
    });

    return result;
};