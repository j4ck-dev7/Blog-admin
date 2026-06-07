export interface AccessTokenPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

export interface ValidatedRefreshToken {
  userId: string;
  jti: string;
  payload: RefreshTokenPayload;
}
