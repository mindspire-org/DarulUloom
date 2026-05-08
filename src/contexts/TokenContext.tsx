import * as React from "react";
import { generateTokenNumber, tokens as seedTokens } from "@/data/mockData";

export type TokenStatus = "pending" | "verified" | "rejected";

export interface TokenRecord {
  id: string;
  tokenNumber: string;
  studentName: string;
  fatherName: string;
  dateOfBirth?: string;
  age?: string;
  currentAddress?: string;
  permanentAddress?: string;
  class: string;
  issueDate: string;
  status: TokenStatus;
  cnic?: string;
  passportNumber?: string;
  idType?: "cnic" | "passport" | "bform";
  contact?: string;
  category?: string;
  statusType?: string;
  bformNumber?: string;
  photoUrl?: string;
  formData?: any;
  testDate?: string;
  resultDate?: string;
}

interface TokenContextValue {
  tokens: TokenRecord[];
  addToken: (token: Omit<TokenRecord, "id"> & { id?: string }) => TokenRecord;
  updateToken: (id: string, patch: Partial<TokenRecord>) => void;
  deleteToken: (id: string) => void;
  regenerateToken: (id: string) => void;
}

const TokenContext = React.createContext<TokenContextValue | null>(null);

const STORAGE_KEY = "jamia_tokens_v1";

function safeParseTokens(raw: string | null): TokenRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as TokenRecord[];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeUniqueTokenNumber(existing: Set<string>) {
  let next = generateTokenNumber();
  let guard = 0;
  while (existing.has(next) && guard < 50) {
    next = generateTokenNumber();
    guard += 1;
  }
  return next;
}

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = React.useState<TokenRecord[]>(() =>
    (() => {
      const stored = safeParseTokens(localStorage.getItem(STORAGE_KEY));
      if (stored.length > 0) return stored;
      return seedTokens.map((t) => ({
        id: t.id,
        tokenNumber: t.tokenNumber,
        studentName: t.studentName,
        fatherName: t.fatherName,
        class: t.class,
        issueDate: t.issueDate,
        status: t.status,
      }));
    })(),
  );

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }, [tokens]);

  const addToken = React.useCallback(
    (token: Omit<TokenRecord, "id"> & { id?: string }) => {
      const id = token.id ?? makeId();
      setTokens((prev) => {
        const existingNumbers = new Set(prev.map((t) => t.tokenNumber));
        const tokenNumber = existingNumbers.has(token.tokenNumber)
          ? makeUniqueTokenNumber(existingNumbers)
          : token.tokenNumber;

        const next: TokenRecord = {
          ...token,
          id,
          tokenNumber,
        };

        return [next, ...prev];
      });

      const existingNumbers = new Set(tokens.map((t) => t.tokenNumber));
      const tokenNumber = existingNumbers.has(token.tokenNumber)
        ? makeUniqueTokenNumber(existingNumbers)
        : token.tokenNumber;

      return {
        ...token,
        id,
        tokenNumber,
      };
    },
    [tokens],
  );

  const updateToken = React.useCallback((id: string, patch: Partial<TokenRecord>) => {
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteToken = React.useCallback((id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const regenerateToken = React.useCallback((id: string) => {
    setTokens((prev) => {
      const existingNumbers = new Set(prev.map((t) => t.tokenNumber));
      return prev.map((t) => {
        if (t.id !== id) return t;
        existingNumbers.delete(t.tokenNumber);
        const nextTokenNumber = makeUniqueTokenNumber(existingNumbers);
        
        // Calculate issue date with validation
        let issueDate;
        try {
          issueDate = new Date().toLocaleDateString("ur-PK");
        } catch (e) {
          const now = new Date();
          issueDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
        }
        
        return {
          ...t,
          tokenNumber: nextTokenNumber,
          issueDate,
          status: "pending",
        };
      });
    });
  }, []);

  const value = React.useMemo<TokenContextValue>(
    () => ({ tokens, addToken, updateToken, deleteToken, regenerateToken }),
    [tokens, addToken, updateToken, deleteToken, regenerateToken],
  );

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokens() {
  const ctx = React.useContext(TokenContext);
  if (!ctx) throw new Error("useTokens must be used within a TokenProvider");
  return ctx;
}
