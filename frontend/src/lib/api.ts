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

export class CharacterApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CharacterApiError";
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
