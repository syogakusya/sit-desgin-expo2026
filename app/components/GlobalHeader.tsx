"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import NavigationMenu from "./NavigationMenu";

type GlobalHeaderProps = {
  activeId?: string;
  className?: string;
  hidden?: boolean;
};

type NavigationItem = {
  id: string;
  label: string;
  href: string;
};

// 共通メニューは全ページで同じ順序・文言に統一します。
const globalMenuItems: NavigationItem[] = [
  { id: "top", label: "TOP", href: "/" },
  { id: "research", label: "研究紹介", href: "/research" },
  { id: "works", label: "作品紹介", href: "/research?tab=works" },
  { id: "events", label: "イベント", href: "/events" },
  { id: "career", label: "卒業生の進路", href: "/career" },
  { id: "contact", label: "お問い合せ", href: "/contact" },
];

// ヘッダーのロゴは共通の画像に差し替えやすいよう定数化します。
const headerLogoUrl = "/icon/header_icon.png";

export default function GlobalHeader({
  activeId,
  className,
  hidden = false,
}: GlobalHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);

  const openMenu = () => {
    setIsMenuMounted(true);
    requestAnimationFrame(() => {
      setIsMenuOpen(true);
    });
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isMenuOpen || !isMenuMounted) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setIsMenuMounted(false);
    }, 200);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [isMenuMounted, isMenuOpen]);

  const contactItem = globalMenuItems.find((item) => item.id === "contact");
  // デスクトップ版は左のロゴがTOP導線のため、TOPを除外して表示します。
  const desktopMenuItems = globalMenuItems.filter(
    (item) => item.id !== "contact" && item.id !== "top",
  );

  return (
    <>
      {isMenuMounted ? (
        <div
          className={`fixed inset-0 z-50 flex justify-center bg-[#F9F9F9] transition-opacity duration-200 ease-out ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <NavigationMenu
            items={globalMenuItems}
            activeId={activeId}
            onClose={closeMenu}
          />
        </div>
      ) : null}

      {/* Figmaのヘッダーは画面上部に固定し、背景の透過と影を再現します。 */}
      <div
        className={`fixed inset-x-0 top-0 z-40 flex justify-center pointer-events-none transition-opacity duration-500 ${
          hidden ? "opacity-0" : "opacity-100"
        } ${className ?? ""}`.trim()}
      >
        <div
          className={`w-full px-4 pt-2 lg:px-4 lg:pt-[24px] ${hidden ? "pointer-events-none" : "pointer-events-auto"}`}
        >
          <div className="flex items-center justify-between rounded-[12px] border border-[#F9F9F9] bg-white/80 px-3 py-1.5 shadow-[0_0_8px_rgba(106,115,120,0.15)] backdrop-blur-[4px] lg:px-5 lg:py-3">
            <Link
              href="/"
              className="flex h-[48px] items-center lg:h-[56px]"
              aria-label="トップページへ"
            >
              <img
                src={headerLogoUrl}
                alt="SIT DESIGN EXPO 2026"
                className="h-full w-auto object-contain"
              />
            </Link>
            {/* デスクトップ版はFigma通りの横並びメニューを表示し、ハンバーガーはモバイルのみ残します。 */}
            <div className="hidden items-center gap-6 lg:flex">
              <nav className="flex items-center">
                {desktopMenuItems.map((item, index) => {
                  const isActive = item.id === activeId;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group flex items-center gap-2 px-3 py-2 text-[16px] font-medium leading-normal ${
                        index !== desktopMenuItems.length - 1
                          ? "border-r border-[#EBEEF0] pr-6"
                          : ""
                      } ${isActive ? "text-[#2E3437]" : "text-[#6A7378]"}`}
                    >
                      {/*
                        ラベルの横幅がページ遷移でブレないよう、丸印は常に同じ幅を確保します。
                        アクティブ時は色付き、非アクティブ時は不可視（スペースは維持）にします。
                      */}
                      <span
                        className={`relative -bottom-px h-3 w-3 rounded-full [background:var(--Grad-new,linear-gradient(135deg,#FB9678_0%,#E5A967_100%))] transition-opacity duration-200 ease-in ${
                          isActive
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              {/* 
                お問い合わせは独立した丸みのあるボタンとして強調し、高さは48pxに固定します。
                視覚的に中央寄せになるよう、文字位置をわずかに上げています。
              */}
              {contactItem ? (
                <Link
                  href={contactItem.href}
                  className="flex h-12 items-center justify-center rounded-full bg-[#4B5459] px-6 text-[16px] font-medium leading-none text-[#F9F9F9]"
                >
                  <span className="relative top-[-1px]">
                    {contactItem.label}
                  </span>
                </Link>
              ) : null}
            </div>
            {/* 既存のハンバーガーメニューはモバイル専用として維持します。 */}
            <button
              className="grid h-10 w-10 place-items-center rounded-full lg:hidden"
              type="button"
              aria-label="メニュー"
              onClick={openMenu}
            >
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  stroke="#6A7378"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
