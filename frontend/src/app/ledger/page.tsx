"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  Transaction,
  TransactionApiError,
  TransactionInput,
  TransactionType,
  updateTransaction,
} from "@/lib/api";

const categories = [
  ["BOSS", "보스"],
  ["HUNTING", "사냥"],
  ["AUCTION", "옥션"],
  ["STARFORCE", "스타포스"],
  ["CUBE", "큐브"],
  ["SYMBOL", "심볼"],
  ["ITEM", "아이템"],
  ["CASH", "캐시"],
  ["ETC", "기타"],
] as const;

type FormState = {
  type: TransactionType;
  category: string;
  amount: string;
  transaction_date: string;
  description: string;
};

function today() {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function emptyForm(): FormState {
  return {
    type: "EXPENSE",
    category: "STARFORCE",
    amount: "",
    transaction_date: today(),
    description: "",
  };
}

function parseAmount(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error("금액은 0보다 큰 정수로 입력해 주세요.");
  }
  const amount = BigInt(value);
  if (amount <= BigInt(0)) {
    throw new Error("금액은 0보다 커야 합니다.");
  }
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("현재 화면에서는 9,007,199,254,740,991 메소까지 정확히 입력할 수 있습니다.");
  }
  return Number(amount);
}

function toInput(form: FormState): TransactionInput {
  return {
    type: form.type,
    category: form.category,
    amount: parseAmount(form.amount),
    transaction_date: form.transaction_date,
    description: form.description.trim() || null,
  };
}

function categoryLabel(category: string) {
  return categories.find(([value]) => value === category)?.[1] ?? category;
}

function formatMeso(amount: bigint) {
  return `${amount.toLocaleString("ko-KR")} 메소`;
}

function requestMessage(error: unknown) {
  if (error instanceof TransactionApiError || error instanceof Error) {
    return error.message;
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function TransactionFields({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (form: FormState) => void;
}) {
  const fieldClass =
    "min-h-11 w-full rounded-xl border border-[#e5d9d0] bg-white px-3 text-sm text-[#302722] outline-none transition focus:border-[#d96746] focus:ring-4 focus:ring-[#d96746]/10";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="grid gap-1.5 text-sm font-bold text-[#5f5149]">
        유형
        <select
          value={form.type}
          onChange={(event) => onChange({ ...form, type: event.target.value as TransactionType })}
          className={fieldClass}
        >
          <option value="INCOME">수입</option>
          <option value="EXPENSE">지출</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-[#5f5149]">
        카테고리
        <select
          value={form.category}
          onChange={(event) => onChange({ ...form, category: event.target.value })}
          className={fieldClass}
        >
          {categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-[#5f5149]">
        금액
        <input
          value={form.amount}
          onChange={(event) => onChange({ ...form, amount: event.target.value.replace(/[^0-9]/g, "") })}
          inputMode="numeric"
          placeholder="100000000"
          className={fieldClass}
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-[#5f5149]">
        거래일
        <input
          type="date"
          value={form.transaction_date}
          onChange={(event) => onChange({ ...form, transaction_date: event.target.value })}
          className={fieldClass}
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-bold text-[#5f5149] sm:col-span-2 lg:col-span-1">
        메모
        <input
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          maxLength={500}
          placeholder="선택 입력"
          className={fieldClass}
        />
      </label>
    </div>
  );
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setTransactions(await getTransactions());
      setError(null);
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getTransactions()
      .then((items) => {
        if (!active) return;
        setTransactions(items);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestMessage(requestError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const month = today().slice(0, 7);
    let income = BigInt(0);
    let expense = BigInt(0);
    for (const transaction of transactions) {
      if (!transaction.transaction_date.startsWith(month)) continue;
      if (transaction.type === "INCOME") income += BigInt(transaction.amount);
      else expense += BigInt(transaction.amount);
    }
    return { income, expense, profit: income - expense };
  }, [transactions]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    try {
      await createTransaction(toInput(form));
      setForm(emptyForm());
      await loadTransactions();
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setIsCreating(false);
    }
  }

  function openEdit(transaction: Transaction) {
    setEditing(transaction);
    setEditForm({
      type: transaction.type,
      category: transaction.category,
      amount: String(transaction.amount),
      transaction_date: transaction.transaction_date,
      description: transaction.description ?? "",
    });
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setIsUpdating(true);
    setError(null);
    try {
      await updateTransaction(editing.id, toInput(editForm));
      setEditing(null);
      await loadTransactions();
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!window.confirm("이 거래내역을 삭제할까요?")) return;
    setDeletingId(transaction.id);
    setError(null);
    try {
      await deleteTransaction(transaction.id);
      await loadTransactions();
    } catch (requestError) {
      setError(requestMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-bold tracking-[0.14em] text-[#d96746] uppercase">Maple Ledger</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#302722] sm:text-4xl">메소 가계부</h1>
          <p className="mt-2 text-[#756860]">수입과 지출을 기록하고 이번 달 흐름을 확인하세요.</p>
        </header>

        <section aria-labelledby="monthly-summary" className="mt-8">
          <h2 id="monthly-summary" className="text-lg font-black text-[#302722]">이번 달</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {[
              ["수입", summary.income, "text-[#3d7b55]"],
              ["지출", summary.expense, "text-[#c65738]"],
              ["순이익", summary.profit, summary.profit >= BigInt(0) ? "text-[#3d7b55]" : "text-[#c65738]"],
            ].map(([label, amount, color]) => (
              <article key={String(label)} className="rounded-2xl border border-white bg-white/85 p-5 shadow-[0_12px_35px_rgba(74,55,45,0.08)]">
                <p className="text-sm font-bold text-[#8b7d74]">{String(label)}</p>
                <p className={`mt-2 break-words text-xl font-black sm:text-2xl ${color}`}>
                  {label === "순이익" && (amount as bigint) > BigInt(0) ? "+" : ""}{formatMeso(amount as bigint)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white bg-white/85 p-5 shadow-[0_16px_45px_rgba(74,55,45,0.08)] sm:p-7">
          <h2 className="text-xl font-black text-[#302722]">거래 등록</h2>
          <form onSubmit={handleCreate} className="mt-5">
            <TransactionFields form={form} onChange={setForm} />
            <div className="mt-5 flex justify-end">
              <button disabled={isCreating} className="min-h-11 rounded-xl bg-[#d96746] px-7 font-bold text-white transition hover:bg-[#c65738] disabled:cursor-not-allowed disabled:opacity-60">
                {isCreating ? "등록 중..." : "등록"}
              </button>
            </div>
          </form>
        </section>

        <div className="mt-5 min-h-6" aria-live="polite">
          {error && <p className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-bold text-[#a5412a]">{error}</p>}
        </div>

        <section className="mt-3 overflow-hidden rounded-3xl border border-white bg-white/85 shadow-[0_16px_45px_rgba(74,55,45,0.08)]">
          <div className="flex items-center justify-between border-b border-[#eee4dc] px-5 py-5 sm:px-7">
            <h2 className="text-xl font-black text-[#302722]">거래내역</h2>
            <span className="text-sm font-bold text-[#8b7d74]">최근 {transactions.length}건</span>
          </div>
          {isLoading ? (
            <p className="px-6 py-14 text-center text-[#756860]">거래내역을 불러오는 중...</p>
          ) : transactions.length === 0 ? (
            <p className="px-6 py-14 text-center text-[#756860]">아직 등록된 거래내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#faf6f2] text-[#756860]">
                  <tr>{["날짜", "유형", "카테고리", "금액", "메모", "관리"].map((title) => <th key={title} className="px-5 py-3 font-bold">{title}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#eee4dc]">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="text-[#4c4039]">
                      <td className="whitespace-nowrap px-5 py-4">{transaction.transaction_date}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${transaction.type === "INCOME" ? "bg-[#edf5e9] text-[#3d7b55]" : "bg-[#fff0eb] text-[#b84d30]"}`}>{transaction.type === "INCOME" ? "수입" : "지출"}</span></td>
                      <td className="px-5 py-4 font-bold">{categoryLabel(transaction.category)}</td>
                      <td className={`whitespace-nowrap px-5 py-4 font-black ${transaction.type === "INCOME" ? "text-[#3d7b55]" : "text-[#c65738]"}`}>{transaction.type === "INCOME" ? "+" : "-"}{formatMeso(BigInt(transaction.amount))}</td>
                      <td className="max-w-64 truncate px-5 py-4 text-[#756860]">{transaction.description ?? "-"}</td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <button onClick={() => openEdit(transaction)} className="font-bold text-[#4f7049] hover:underline">수정</button>
                        <button onClick={() => void handleDelete(transaction)} disabled={deletingId === transaction.id} className="ml-4 font-bold text-[#b84d30] hover:underline disabled:opacity-50">{deletingId === transaction.id ? "삭제 중" : "삭제"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#302722]/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="edit-title" className="w-full max-w-3xl rounded-3xl bg-[#fffdfa] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h2 id="edit-title" className="text-xl font-black text-[#302722]">거래 수정</h2>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-sm font-bold text-[#756860] hover:bg-[#f3ebe5]">닫기</button>
            </div>
            <form onSubmit={handleUpdate} className="mt-5">
              <TransactionFields form={editForm} onChange={setEditForm} />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-[#dccdc3] px-5 font-bold text-[#756860]">취소</button>
                <button disabled={isUpdating} className="min-h-11 rounded-xl bg-[#4f7049] px-6 font-bold text-white disabled:opacity-60">{isUpdating ? "수정 중..." : "수정 저장"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
