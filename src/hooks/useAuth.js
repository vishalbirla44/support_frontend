import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth()
 * Returns { user, token, login, loginWithToken, logout, isAdmin }
 */
export function useAuth() {
  return useContext(AuthContext);
}