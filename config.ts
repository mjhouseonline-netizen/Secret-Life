
const DEFAULT_CLIENT_ID = '1042356611430-qa2i8o4fgavdqu9ivvtq9i1qdlpomp5p.apps.googleusercontent.com';

export function getGoogleClientId(): string {
  try {
    if (typeof process !== 'undefined' && process.env?.GOOGLE_CLIENT_ID) {
      return process.env.GOOGLE_CLIENT_ID;
    }
  } catch (_e) { /* env not available */ }
  return DEFAULT_CLIENT_ID;
}
