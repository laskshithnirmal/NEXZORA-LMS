package com.nexzora.lms.util;

/** Small helpers for cleaning optional text fields from requests. */
public final class TextUtils {

    private TextUtils() {
    }

    public static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    /** Trims the value, turning null, empty or whitespace-only input into null (stored as SQL NULL). */
    public static String trimToNull(String s) {
        return isBlank(s) ? null : s.trim();
    }
}
