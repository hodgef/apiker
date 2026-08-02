import { MAX_STR_LEN, MIN_STR_LEN } from "./constants";

/**
 * Checks whether a string is a plausible email address (3–50 chars and a
 * `local@domain.tld` shape). Intended as a lightweight guard, not full RFC 5322
 * validation.
 *
 * @param email Value to validate.
 * @returns `true` when the value looks like a valid email address.
 */
export const isEmail = (email: string) => {
    return !!email && isRequiredLength(email, 3, 50) && /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/.test(email);
};

/**
 * Checks whether a string's length is within an inclusive range.
 *
 * @param str Value to measure.
 * @param minLegth Minimum length; defaults to {@link MIN_STR_LEN}.
 * @param maxLength Maximum length; defaults to {@link MAX_STR_LEN}.
 * @returns `true` when `str` is non-empty and within `[minLegth, maxLength]`.
 */
export const isRequiredLength = (str: string, minLegth = MIN_STR_LEN, maxLength = MAX_STR_LEN) => {
    return !!str && str.length >= minLegth && str.length <= maxLength;
};