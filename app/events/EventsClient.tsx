"use client";

import Link from "next/link";

import Footer from "../components/Footer";
import GlobalHeader from "../components/GlobalHeader";
import useSectionReveal from "../components/useSectionReveal";

type ReservedEvent = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  ariaLabel?: string;
};

// Figma指定のカード内容を配列で一元管理し、文言/リンクの差し替えを局所化します。
const reservedEvents: ReservedEvent[] = [
  {
    id: "osekkai",
    title: "【高校生向け】 デザイン工学部なんでも相談会-OSEKKAI-",
    description:
      "現役生によるデザイン工学部なんでも相談会です！学部4年生以上が参加しますのでこの機会にたくさん質問してください。",
    // 変更理由: イベント一覧でも同一バナーを使用するため、WebPへ統一して初回転送量を削減します。
    imageSrc: "/image/osekkai.webp",
    imageAlt: "OSEKKAIのイベントバナー",
    // 詳細ページの実装先に合わせ、一覧導線はOSEKKAIカード側に設定します。
    // 変更理由: 実際の公開URL(/events/farewell-lecture)に導線を統一し、
    // ページ内遷移とSNS共有URLの不一致を防ぎます。
    href: "/events/farewell-lecture",
    ariaLabel: "デザイン工学部なんでも相談会-OSEKKAI-ページへ",
  },
  {
    id: "osekkai-ii",
    title: "【デザ工1,2年生向け】デザイン工学部なんでも相談会-OSEKKAⅡ-",
    description:
      // 変更理由: OSEKKAⅡ詳細ページの概要冒頭と表現を統一し、一覧カードと詳細で案内トーンの差をなくします。
      "豊洲キャンパスに通うデザイン工学部の先輩達が、皆さんのお悩みにお答えする相談会です！学部4年生以上が参加しますのでこの機会にたくさん相談してください。",
    imageSrc: "/image/osekkai2.webp",
    imageAlt: "【デザ工1,2年生向け】デザイン工学部なんでも相談会 OSEKKAⅡ",
    href: "/events/osekkai-ii",
    ariaLabel:
      "【デザ工1,2年生向け】デザイン工学部なんでも相談会-OSEKKAⅡ-ページへ",
  },
  {
    id: "konsinkai",
    title: "退職される先生の最終講義と懇親会",
    description:
      "2025年度をもって芝浦工業大学を退職される、島田明先生・吉武良治先生の最終講義および懇親会を実施します。",
    imageSrc: "/image/event-image.png",
    imageAlt: "退職される先生の最終講義と懇親会",
    href: "/events/konsinkai",
    ariaLabel: "退職される先生の最終講義と懇親会ページへ",
  },
];

export default function EventsClient() {
  // 変更理由: Figma更新でイベントページ上部のトグルUIが廃止されたため、
  // クエリ同期を含むタブ切替状態を撤去し、単一のイベント一覧として表示します。
  useSectionReveal();

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <GlobalHeader activeId="events" />

      <main className="pb-12 pt-[92px] md:pb-0 md:pt-[144px]">
        <section
          data-reveal
          className="mx-auto w-full px-4 py-6 md:px-[128px] md:py-9"
        >
          {/* 変更理由: Figmaの見出し仕様に合わせ、イベントラベルを固定表示します。 */}
          <div className="flex items-center gap-[10px]">
            <span className="h-6 w-2 rounded-[4px] bg-gradient-to-b from-[#FB9678] to-[#E5A967]" />
            <h1 className="text-[24px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[28px]">
              イベント
            </h1>
          </div>
        </section>

        <section
          data-reveal
          className="mx-auto w-full px-4 pb-12 pt-0 md:px-[128px] md:pb-[128px] md:pt-0"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-9">
            {reservedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function EventCard({ event }: { event: ReservedEvent }) {
  const cardContent = (
    <article className="group flex h-full flex-col gap-3 rounded-[12px] bg-white/80 p-4 shadow-[0_0_8px_rgba(106,115,120,0.1)] md:gap-5 md:rounded-[20px] md:p-6">
      <img
        src={event.imageSrc}
        alt={event.imageAlt}
        className="aspect-[1920/1080] w-full rounded-[8px] object-cover md:rounded-[12px]"
      />

      <div className="flex flex-col gap-1 md:gap-2">
        <h2 className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] transition-colors duration-200 group-hover:text-[#D3793D] group-active:text-[#D3793D]">
          {event.title}
        </h2>
        {/* 説明文はFigmaどおり2行で打ち切り、カード高さの揺れを抑えて整列を維持します。 */}
        <p
          className="text-[15px] leading-[2] tracking-[0.04em] text-[#6A7378] md:text-[18px]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </p>
      </div>

      <div className="mt-auto flex justify-end">
        <span className="inline-flex items-center gap-1 px-1 text-[13px] font-medium leading-[1.5] text-[#D3793D] md:gap-2 md:px-2 md:text-[15px]">
          <span>詳しく見る</span>
          <ChevronRightIcon />
        </span>
      </div>
    </article>
  );

  if (!event.href) {
    return cardContent;
  }

  return (
    <Link
      href={event.href}
      aria-label={event.ariaLabel}
      className="block rounded-[12px] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#FB9678] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F9] md:rounded-[20px]"
    >
      {cardContent}
    </Link>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-hidden="true"
    >
      <path
        d="M10 7L15 12L10 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
