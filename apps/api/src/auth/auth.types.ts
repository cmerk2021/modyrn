/**
 * The authenticated principal attached to each request after the auth guard
 * validates the session JWT.
 */
export interface AuthenticatedUser {
  /** Discord user ID. */
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  /** Session ID, used for revocation. */
  sessionId: string;
}

/** Claims embedded in the session JWT. */
export interface SessionJwtPayload {
  sub: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  sid: string;
}
