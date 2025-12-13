// /types.ts

export interface JwtPayload {
  sub: string;
  exp: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}