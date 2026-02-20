import { apiFetch } from "./api";

export type TokenResponse = { access_token: string; token_type: string };

export async function register(email: string, password: string) {
  return apiFetch("/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
