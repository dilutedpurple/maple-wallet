"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import { Character, CharacterApiError, getCharacter } from "@/lib/api";

export default function Home() {
  const [characterName, setCharacterName] = useState("");
  const [character, setCharacter] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = characterName.trim();

    if (!normalizedName) {
      setCharacter(null);
      setError("캐릭터 닉네임을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCharacter(null);
    setImageFailed(false);

    try {
      setCharacter(await getCharacter(normalizedName));
    } catch (requestError) {
      setError(
        requestError instanceof CharacterApiError
          ? requestError.message
          : "캐릭터 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-12 sm:px-8">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#f7b79f]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-[#b9d4b0]/35 blur-3xl" />

      <section className="relative w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_24px_70px_rgba(74,55,45,0.12)] backdrop-blur sm:p-10">
        <header className="text-center">
          <span className="inline-flex items-center rounded-full bg-[#edf5e9] px-3 py-1 text-xs font-bold tracking-[0.14em] text-[#4f7049] uppercase">
            Character Search
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-[#302722] sm:text-5xl">
            Maple <span className="text-[#d96746]">Wallet</span>
          </h1>
          <p className="mt-3 text-base text-[#756860] sm:text-lg">
            메이플스토리 캐릭터를 검색해보세요.
          </p>
        </header>

        <form className="mt-8" onSubmit={handleSubmit} noValidate>
          <label htmlFor="character-name" className="sr-only">
            캐릭터 닉네임
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="character-name"
              name="characterName"
              type="text"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder="캐릭터 닉네임"
              autoComplete="off"
              className="min-h-13 flex-1 rounded-2xl border border-[#e5d9d0] bg-white px-5 text-base text-[#302722] outline-none transition placeholder:text-[#aa9d94] focus:border-[#d96746] focus:ring-4 focus:ring-[#d96746]/10"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-13 rounded-2xl bg-[#d96746] px-7 font-bold text-white shadow-[0_10px_24px_rgba(217,103,70,0.24)] transition hover:bg-[#c65738] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d96746] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "검색 중" : "검색"}
            </button>
          </div>
        </form>

        <div className="mt-5 min-h-7 text-center" aria-live="polite">
          {isLoading && (
            <p className="text-sm font-medium text-[#756860]">
              캐릭터 정보를 불러오는 중...
            </p>
          )}
          {error && (
            <p className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-medium text-[#a5412a]">
              {error}
            </p>
          )}
        </div>

        {character && (
          <article className="mt-3 grid gap-6 rounded-3xl border border-[#eee4dc] bg-[#fffdfa] p-5 sm:grid-cols-[180px_1fr] sm:items-center sm:p-7">
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#edf5e9] to-[#f8ede5]">
              {character.character_image && !imageFailed ? (
                <Image
                  src={character.character_image}
                  alt={`${character.character_name} 캐릭터 이미지`}
                  width={180}
                  height={180}
                  className="h-full w-full object-contain p-2"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span className="px-4 text-center text-sm font-medium text-[#8b7d74]">
                  캐릭터 이미지가 없습니다.
                </span>
              )}
            </div>

            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-[#d96746]">
                {character.character_level !== null
                  ? `Lv. ${character.character_level}`
                  : "레벨 정보 없음"}
              </p>
              <h2 className="mt-1 break-all text-3xl font-black tracking-[-0.03em] text-[#302722]">
                {character.character_name}
              </h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm sm:justify-start">
                {character.world_name && (
                  <span className="rounded-full bg-[#edf5e9] px-3 py-1.5 font-semibold text-[#4f7049]">
                    {character.world_name}
                  </span>
                )}
                {character.character_class && (
                  <span className="rounded-full bg-[#f7ece5] px-3 py-1.5 font-semibold text-[#9a5039]">
                    {character.character_class}
                  </span>
                )}
              </div>
              <p className="mt-5 text-sm text-[#756860]">
                길드: {character.character_guild_name ?? "가입 정보 없음"}
              </p>
            </div>
          </article>
        )}

        <footer className="mt-8 text-center text-xs text-[#9a8d84]">
          Data based on NEXON Open API
        </footer>
      </section>
    </main>
  );
}
