'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Copy,
  CheckCircle2,
  ExternalLink,
  Home,
  Search,
  Users,
  Wallet2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import type { Balance, TransactionRecord } from '@/lib/stellar';
import {
  formatAmount,
  getBalance,
  getTransactionHistory,
  truncatePublicKey,
} from '@/lib/stellar';
import { cn, copyToClipboard } from '@/lib/utils';
import { isFreighterInstalled, getPublicKey as freighterGetPublicKey } from '@/lib/freighter';

/* ─── SKELETON ─────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-[#E5E7EB]', className)} />
  );
}

/* ─── PAGE ─────────────────────────────────────────────── */

export default function WorkerPage() {
  const [viewingKey, setViewingKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [freighterError, setFreighterError] = useState<string | null>(null);

  const isValidKey = inputKey.startsWith('G') && inputKey.length === 56;

  const handleSubmit = useCallback(() => {
    if (isValidKey) {
      setViewingKey(inputKey.trim());
    }
  }, [inputKey, isValidKey]);

  const handleFreighterConnect = useCallback(async () => {
    setFreighterError(null);

    if (!isFreighterInstalled()) {
      setFreighterError('Freighter wallet is not installed.');
      return;
    }

    try {
      const pk = await freighterGetPublicKey();
      setInputKey(pk);
      setViewingKey(pk);
    } catch (err) {
      setFreighterError(
        err instanceof Error ? err.message : 'Failed to connect Freighter'
      );
    }
  }, []);

  const handleClear = useCallback(() => {
    setViewingKey(null);
    setInputKey('');
    setFreighterError(null);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAVBAR ────────────────────────────────── */}
      <nav className="sticky top-0 z-50 h-16 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#14A800]" />
              <span className="font-semibold text-[#111111]">
                Worker Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-[#6B7280] transition-colors hover:text-[#111111] sm:inline"
            >
              Dashboard
            </Link>
            {viewingKey && (
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────── */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        {!viewingKey ? (
          <EntryState
            inputKey={inputKey}
            setInputKey={setInputKey}
            isValidKey={isValidKey}
            onSubmit={handleSubmit}
            onFreighterConnect={handleFreighterConnect}
            freighterError={freighterError}
          />
        ) : (
          <WorkerPassport
            publicKey={viewingKey}
            onClear={handleClear}
          />
        )}
      </main>
    </div>
  );
}

/* ─── STATE 1: ENTRY ───────────────────────────────────── */

function EntryState({
  inputKey,
  setInputKey,
  isValidKey,
  onSubmit,
  onFreighterConnect,
  freighterError,
}: {
  inputKey: string;
  setInputKey: (v: string) => void;
  isValidKey: boolean;
  onSubmit: () => void;
  onFreighterConnect: () => void;
  freighterError: string | null;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Users className="mx-auto h-16 w-16 text-[#E5E7EB]" />

      <h1 className="mt-6 text-2xl font-bold text-[#111111]">
        Worker Payment Passport
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[#6B7280]">
        Enter a Stellar public key to view on-chain payment history — your
        verifiable proof of work.
      </p>

      {/* Address input */}
      <div className="mt-8 w-full max-w-lg">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              placeholder="Enter Worker Stellar Public Key (G...)"
              className="h-12 w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 font-mono text-sm text-[#111111] placeholder-[#6B7280] outline-none transition-colors focus:border-[#14A800]/50"
            />
            {isValidKey && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#14A800]" />
            )}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValidKey}
            className="h-12 shrink-0 rounded-lg bg-[#14A800] px-6 font-semibold text-white transition-colors hover:bg-[#108A00] disabled:opacity-40"
          >
            Verify Key
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 border-t border-[#E5E7EB]" />
          <span className="text-xs text-[#6B7280]">or</span>
          <div className="flex-1 border-t border-[#E5E7EB]" />
        </div>

        {/* Freighter connect */}
        <button
          type="button"
          onClick={onFreighterConnect}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] font-semibold text-[#111111] transition-colors hover:bg-[#F9FAFB]"
        >
          <Wallet2 className="h-4 w-4" />
          Connect Freighter Wallet
        </button>

        {freighterError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {freighterError}
          </div>
        )}

        <a
          href="https://www.freighter.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block text-sm text-[#6B7280] underline transition-colors hover:text-[#111111]"
        >
          Don&apos;t have Freighter? Download it free →
        </a>
      </div>
    </div>
  );
}

/* ─── STATE 2: WORKER PASSPORT ─────────────────────────── */

function WorkerPassport({
  publicKey,
  onClear,
}: {
  publicKey: string;
  onClear: () => void;
}) {
  const [addressCopied, setAddressCopied] = useState(false);

  const {
    data: balance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useQuery<Balance>({
    queryKey: ['account', publicKey],
    queryFn: () => getBalance(publicKey),
    enabled: !!publicKey,
    refetchInterval: 30000,
    retry: 1,
  });

  const {
    data: transactions,
    isLoading: txLoading,
  } = useQuery<TransactionRecord[]>({
    queryKey: ['transactions', publicKey],
    queryFn: () => getTransactionHistory(publicKey),
    enabled: !!publicKey,
  });

  const accountExists = !balanceError;
  const accountActive =
    balance && balance.xlm !== '0' && balance.xlm !== '0.0000000';

  const handleCopyAddress = async () => {
    const ok = await copyToClipboard(publicKey);
    if (ok) {
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── PASSPORT HEADER ───────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#14A800]">
            PAYMENT PASSPORT
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#111111]">
            Worker Profile
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-mono text-sm text-[#6B7280]">
              {truncatePublicKey(publicKey, 8)}
            </p>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              {addressCopied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#14A800]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B7280] transition-colors hover:text-[#111111]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm text-[#6B7280] transition-colors hover:bg-[#F9FAFB]"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* ── UNFUNDED ACCOUNT ──────────────────────── */}
      {!balanceLoading && !accountExists && (
        <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-8 text-center">
          <Wallet2 className="mx-auto h-12 w-12 text-[#FED7AA]" />
          <h2 className="mt-4 text-lg font-semibold text-[#92400E]">
            Unfunded Account
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#B45309]">
            This Stellar address has not been funded yet. The account needs to
            receive XLM before it can hold USDC or appear on-chain.
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#B45309] underline"
          >
            Check on Explorer
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* ── BALANCE CARDS ─────────────────────────── */}
      {(balanceLoading || accountExists) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {balanceLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : balance ? (
            <>
              {/* USDC */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                  USDC Balance
                </p>
                <p className="mt-2 text-3xl font-bold text-[#111111]">
                  {formatAmount(balance.usdc, '')}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">USD Coin</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#14A800]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14A800]" />
                  {accountActive ? 'Active' : 'Zero balance'}
                </span>
              </div>

              {/* XLM */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">
                  XLM Balance
                </p>
                <p className="mt-2 text-3xl font-bold text-[#111111]">
                  {formatAmount(balance.xlm, '')}
                </p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Stellar Lumens · Gas fees
                </p>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── PAYMENT HISTORY ───────────────────────── */}
      {(txLoading || accountExists) && (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="mb-6 text-lg font-semibold text-[#111111]">
            Payment History
          </h3>

          {txLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 border-b border-[#E5E7EB] py-4 last:border-0"
                >
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (transactions ?? []).length === 0 ? (
            <div className="rounded-xl bg-[#F9FAFB] p-8 text-center">
              <p className="text-sm text-[#6B7280]">
                No payment history found for this address.
              </p>
            </div>
          ) : (
            <div>
              {(transactions ?? []).map((tx, idx) => {
                const incoming = tx.to === publicKey;
                const date = new Date(tx.createdAt).toLocaleDateString(
                  'en-US',
                  { month: 'short', day: 'numeric', year: 'numeric' }
                );
                const time = new Date(tx.createdAt).toLocaleTimeString(
                  'en-US',
                  { hour: '2-digit', minute: '2-digit', hour12: false }
                );

                return (
                  <a
                    key={tx.id}
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center justify-between rounded-lg px-2 py-4 transition-colors hover:bg-[#F9FAFB]',
                      idx < (transactions ?? []).length - 1 &&
                        'border-b border-[#E5E7EB]'
                    )}
                  >
                    {/* Left */}
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          incoming ? 'bg-[#F0FDF4]' : 'bg-[#FFF1F2]'
                        )}
                      >
                        {incoming ? (
                          <ArrowDownLeft className="h-5 w-5 text-[#14A800]" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-[#E24B4A]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111111]">
                          {tx.memo || 'Payment'}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {date} · {time}
                        </p>
                      </div>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            incoming ? 'text-[#14A800]' : 'text-[#E24B4A]'
                          )}
                        >
                          {incoming ? '+' : '-'}
                          {tx.amount} {tx.asset}
                        </p>
                        <p className="font-mono text-xs text-[#6B7280]">
                          {truncatePublicKey(
                            incoming ? tx.from : tx.to,
                            4
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#E5E7EB]" />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
