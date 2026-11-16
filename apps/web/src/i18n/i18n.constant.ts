// The locale the user chose, written by the language button and read by the
// request config, the pre-paint locale script and the error document.
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

// One year — locale is a durable user preference.
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

// The time zone every translation formats dates in, on the server and the client.
export const I18N_TIME_ZONE = 'UTC'
