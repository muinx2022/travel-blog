"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-context";

type EntityActionsProps = {
  targetType: string;
  targetDocumentId: string;
  targetTitle?: string;
  allowLike?: boolean;
  allowFollow?: boolean;
  allowContact?: boolean;
  allowReport?: boolean;
};

type ToggleAction = "like" | "follow" | "report";

function ContactModal({
  open,
  message,
  loading,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  message: string;
  loading: boolean;
  error: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Liên hệ chủ sở hữu</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Để lại lời nhắn để gửi tới chủ nội dung.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <textarea
          value={message}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          placeholder="Nhập lời nhắn của bạn..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {loading ? "Đang gửi..." : "Gửi liên hệ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EntityActions({
  targetType,
  targetDocumentId,
  targetTitle,
  allowLike = true,
  allowFollow = false,
  allowContact = false,
  allowReport = true,
}: EntityActionsProps) {
  const { isLoggedIn, jwt, user, openLoginModal } = useAuth();
  const isReadOnly = Boolean(user?.isBanned);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [reported, setReported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn || !jwt || loadedRef.current) return;
    loadedRef.current = true;

    fetch(
      `/api/interaction-proxy?targetType=${encodeURIComponent(targetType)}&targetDocumentId=${encodeURIComponent(targetDocumentId)}`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    )
      .then((r) => r.json())
      .then((data) => {
        setLiked(!!data.liked);
        setFollowed(!!data.followed);
        setReported(!!data.reported);
      })
      .catch(() => undefined);
  }, [isLoggedIn, jwt, targetType, targetDocumentId]);

  const toggleInteraction = async (actionType: ToggleAction) => {
    if (isReadOnly) {
      return;
    }
    if (!isLoggedIn || !jwt) {
      openLoginModal();
      return;
    }

    const res = await fetch("/api/interaction-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ actionType, targetType, targetDocumentId }),
    }).catch(() => null);

    if (!res?.ok) return;

    const data = await res.json();
    const active = !!data?.data?.active;

    if (actionType === "like") setLiked(active);
    if (actionType === "follow") setFollowed(active);
    if (actionType === "report") setReported(active);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // no-op
    }
  };

  const openContact = () => {
    if (isReadOnly) {
      return;
    }
    if (!isLoggedIn || !jwt) {
      openLoginModal();
      return;
    }
    setContactSuccess(false);
    setContactError("");
    setContactOpen(true);
  };

  const submitContact = async () => {
    if (isReadOnly) {
      return;
    }
    if (!jwt) return;

    const message = contactMsg.trim();
    if (message.length < 10) {
      setContactError("Vui lòng nhập lời nhắn tối thiểu 10 ký tự.");
      return;
    }

    setContactLoading(true);
    setContactError("");

    const res = await fetch("/api/interaction-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        mode: "contact",
        actionType: "contact",
        targetType,
        targetDocumentId,
        targetTitle,
        message,
      }),
    }).catch(() => null);

    setContactLoading(false);

    if (!res?.ok) {
      const payload = await res?.json().catch(() => null);
      setContactError(payload?.error?.message || payload?.error || "Gửi liên hệ thất bại.");
      return;
    }

    setContactSuccess(true);
    setContactMsg("");
    setTimeout(() => setContactOpen(false), 1000);
  };

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2 border-y border-zinc-200 py-4 dark:border-zinc-700">
        {allowLike && (
          <button
            type="button"
            onClick={() => toggleInteraction("like")}
            disabled={isReadOnly}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              liked
                ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                : "text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-red-900/30"
            } ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            Thích
          </button>
        )}

        {allowFollow && (
          <button
            type="button"
            onClick={() => toggleInteraction("follow")}
            disabled={isReadOnly}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              followed
                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                : "text-zinc-600 hover:bg-blue-50 hover:text-blue-600 dark:text-zinc-300 dark:hover:bg-blue-900/30"
            } ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
            {followed ? "Đang theo dõi" : "Theo dõi"}
          </button>
        )}

        {allowContact && (
          <button
            type="button"
            onClick={openContact}
            disabled={isReadOnly}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 ${
              isReadOnly ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Liên hệ
          </button>
        )}

        {allowReport && (
          <button
            type="button"
            onClick={() => toggleInteraction("report")}
            disabled={isReadOnly}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              reported
                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                : "text-zinc-600 hover:bg-amber-50 hover:text-amber-700 dark:text-zinc-300 dark:hover:bg-amber-900/30"
            } ${isReadOnly ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v16"/><path d="M4 4h11l-1.5 4L15 12H4"/></svg>
            {reported ? "Đã báo cáo" : "Báo cáo"}
          </button>
        )}

        <button
          type="button"
          onClick={handleShare}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            copied
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              Đã sao chép
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              Chia sẻ
            </>
          )}
        </button>
      </div>

      {contactSuccess && (
        <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-300">
          Đã gửi liên hệ thành công.
        </p>
      )}

      <ContactModal
        open={contactOpen}
        message={contactMsg}
        loading={contactLoading}
        error={contactError}
        onChange={setContactMsg}
        onClose={() => {
          if (!contactLoading) setContactOpen(false);
        }}
        onSubmit={submitContact}
      />
    </>
  );
}
