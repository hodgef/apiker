import { MAX_STR_LEN, MIN_STR_LEN } from "./constants";

export const isEmail = (email: string) => {
    return !!email && isRequiredLength(email, 3, 50) && /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(email);
};

export const isRequiredLength = (str: string, minLegth = MIN_STR_LEN, maxLength = MAX_STR_LEN) => {
    return !!str && str.length >= minLegth && str.length <= maxLength;
};