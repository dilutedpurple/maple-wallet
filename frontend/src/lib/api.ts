export type Character = {
  ocid: string;
  character_name: string;
  world_name: string | null;
  character_class: string | null;
  character_level: number | null;
  character_exp: number | null;
  character_exp_rate: string | null;
  character_guild_name: string | null;
  character_image: string | null;
};

export type TransactionType = "INCOME" | "EXPENSE";

export type Transaction = {
  id: number;
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
};

export type TransactionInput = {
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
};

export type TransactionUpdateInput = Partial<TransactionInput>;

export class CharacterApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CharacterApiError";
  }
}

export class TransactionApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TransactionApiError";
  }
}

type ErrorPayload = { detail?: unknown };

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function getCharacter(characterName: string): Promise<Character> {
  const normalizedName = characterName.trim();
  if (!normalizedName) {
    throw new CharacterApiError("캐릭터 닉네임을 입력해 주세요.", 422);
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/characters/${encodeURIComponent(normalizedName)}`,
      { method: "GET" },
    );
  } catch {
    throw new CharacterApiError(
      "백엔드 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해 주세요.",
      0,
    );
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      const payload = (await response.json()) as ErrorPayload;
      detail = typeof payload.detail === "string" ? payload.detail : null;
    } catch {
      // Hide malformed upstream responses and use a safe fallback below.
    }

    const message =
      response.status === 404
        ? "해당 캐릭터를 찾을 수 없습니다. 닉네임을 확인해 주세요."
        : detail ?? "캐릭터 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    throw new CharacterApiError(message, response.status);
  }

  try {
    return (await response.json()) as Character;
  } catch {
    throw new CharacterApiError("백엔드 응답을 처리할 수 없습니다.", 502);
  }
}

async function transactionRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new TransactionApiError(
      "백엔드 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해 주세요.",
      0,
    );
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      const payload = (await response.json()) as ErrorPayload;
      detail = typeof payload.detail === "string" ? payload.detail : null;
    } catch {
      // Do not expose malformed backend responses to the browser.
    }

    const message =
      response.status === 404
        ? "해당 거래내역을 찾을 수 없습니다."
        : response.status === 422
          ? "입력값을 확인해 주세요."
          : detail ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    throw new TransactionApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TransactionApiError("백엔드 응답을 처리할 수 없습니다.", 502);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  const pageSize = 100;

  for (let offset = 0; ; offset += pageSize) {
    const page = await transactionRequest<Transaction[]>(
      `/api/transactions?limit=${pageSize}&offset=${offset}`,
    );
    transactions.push(...page);
    if (page.length < pageSize) return transactions;
  }
}

export function createTransaction(
  input: TransactionInput,
): Promise<Transaction> {
  return transactionRequest<Transaction>("/api/transactions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateTransaction(
  id: number,
  input: TransactionUpdateInput,
): Promise<Transaction> {
  return transactionRequest<Transaction>(`/api/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteTransaction(id: number): Promise<void> {
  return transactionRequest<void>(`/api/transactions/${id}`, {
    method: "DELETE",
  });
}
