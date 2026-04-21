import React from "react";
import * as api from "@/utils/api";
import { getToken, clearToken, clearOrg, setOrg, getOrg, getLoginTime } from "@/utils/storage";

const SESSION_TIMEOUT = 3 * 24 * 60 * 60 * 1000; // 3 ngày


type User = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: 'ADMIN' | 'USER';
};

type AuthContextValue = {
  authReady: boolean;
  user: User | null;
  token: string;
  activeOrg: api.Org | null;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setActiveOrg: (org: api.Org | null) => Promise<void>;
};

const AuthCtx = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = React.useState(false);
  const [token, setTokenState] = React.useState("");
  const [user, setUser] = React.useState<User | null>(null);
  const [activeOrg, setActiveOrgState] = React.useState<api.Org | null>(null);

  const refreshSession = React.useCallback(async () => {
    const t = await getToken();
    const loginTime = await getLoginTime();
    const now = Date.now();

    // Kiểm tra nếu phiên đã quá 3 ngày
    if (t && now - loginTime > SESSION_TIMEOUT) {
      await clearToken();
      await clearOrg();
      setTokenState("");
      setUser(null);
      setActiveOrgState(null);
      setAuthReady(true);
      return;
    }

    const org = await getOrg();

    setTokenState(t || "");
    setActiveOrgState(org);

    if (t) {
      try {
        // ✅ gọi /api/user/me để lấy thông tin thật
        const data = await api.me();
        setUser(data?.user || null);
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setAuthReady(true);
  }, []);

  React.useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithEmail = React.useCallback(async (email: string, password: string) => {
    const data = await api.login(email, password);
    const t = String(data.token || "");

    setTokenState(t);

    // ✅ lấy thông tin user đầy đủ sau login
    try {
      const meData = await api.me();
      setUser(meData?.user || data.user || { id: "user", email });
    } catch {
      setUser(data.user || { id: "user", email });
    }

    try {
      const orgs = await api.listMyOrgs({ noMockFallback: true });
      if (orgs.length > 0) {
        await setOrg(orgs[0].id, orgs[0].name);
        setActiveOrgState(orgs[0]);
      }
    } catch (orgErr) {
      console.warn("Failed to auto-select org in login flow:", orgErr);
    }

    setAuthReady(true);
  }, []);

  const login = loginWithEmail; // alias for compatibility

  const register = React.useCallback(async (name: string, email: string, pass: string) => {
    // Note: register function in api.ts is named registerOrg but it's used for user registration
    const data = await api.registerOrg("Default Org", email, pass, name);
    const t = String(data.token || "");
    setTokenState(t);
    setUser(data.user || { id: "user", email, name });
    setAuthReady(true);
  }, []);

  const setActiveOrg = React.useCallback(async (org: api.Org | null) => {
    if (!org) return;
    await setOrg(org.id, org.name);
    setActiveOrgState(org);
  }, []);

  // ✅ logout clear hết state và storage
  const logout = React.useCallback(async () => {
    await clearToken();
    await clearOrg();
    setTokenState("");
    setUser(null);
    setActiveOrgState(null);
    setAuthReady(true);
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        authReady,
        user,
        token,
        activeOrg,
        refreshSession,
        login,
        loginWithEmail,
        register,
        logout,
        setActiveOrg,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
