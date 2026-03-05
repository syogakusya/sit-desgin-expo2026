"use client";

import { useRouter } from "next/navigation";

import Footer from "../../components/Footer";
import GlobalHeader from "../../components/GlobalHeader";
import useSectionReveal from "../../components/useSectionReveal";

const pointCards = [
  {
    title: "就活のリアルを間近で",
    description: ["今まで作ってきたポートフォリオが見られる！"],
  },
  {
    title: "現役生とフリートーク",
    description: ["すでに就活を終わらせた先輩や進学を決めた先輩の話を聴ける！"],
  },
];

export default function OsekkaiClient() {
  const router = useRouter();
  useSectionReveal();

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <GlobalHeader activeId="events" />

      <main className="pb-12 pt-[92px] md:pb-[48px] md:pt-[124px]">
        <div className="mx-auto w-full px-4 md:max-w-[1280px] md:px-[128px]">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }
              router.push("/events");
            }}
            className="inline-flex h-[80px] items-center gap-2 text-[13px] font-medium text-[#6A7378] md:gap-3 md:text-[15px]"
          >
            <BackChevronIcon />
            <span>戻る</span>
          </button>
        </div>

        <section
          data-reveal
          className="mx-auto w-full px-4 pb-8 md:max-w-[1280px] md:px-[128px] md:pb-14"
        >
          <div className="space-y-3 md:space-y-5">
            <img
              src="/image/osekkai2.webp"
              alt="【デザ工1,2年生向け】デザイン工学部なんでも相談会 OSEKKAⅡ"
              className="aspect-[1920/1080] w-full rounded-[8px] object-cover md:rounded-[12px]"
            />

            <h1 className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
              【デザ工1,2年生向け】デザイン工学部なんでも相談会-OSEKKAⅡ-
            </h1>

            <div className="space-y-0 text-[15px] leading-[2] tracking-[0.04em] text-[#4B5459] md:text-[18px]">
              <p>
                豊洲キャンパスに通うデザイン工学部の先輩達が、皆さんのお悩みにお答えする相談会です！学部4年生以上が参加しますのでこの機会にたくさん相談してください！
                「研究室ってどんな雰囲気？」「豊洲はどんな感じ？」「就活は大変？」
                そんな疑問に、現役の学生が「おせっかい」なくらい親身にお答えします！これから通うことになる豊洲キャンパスに一足先に遊びに来ませんか？
              </p>
              <p>開催日：3/15（日）15:30~16:30</p>
              <p>開催場所：豊洲キャンパス本部棟6階オープンラボ</p>
            </div>
          </div>
        </section>

        <section
          data-reveal
          className="mx-auto w-full px-4 pb-8 md:max-w-[1280px] md:px-[128px] md:pb-12"
        >
          <div className="flex items-center gap-6">
            <span className="h-px flex-1 bg-[#EBEEF0]" />
            <h2 className="text-center text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#4B5459] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
              OSEKKAⅡ2大ポイント
            </h2>
            <span className="h-px flex-1 bg-[#EBEEF0]" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 md:mt-6 md:grid-cols-2 md:gap-5">
            {pointCards.map((point) => (
              <article
                key={point.title}
                className="rounded-[12px] border border-[#EBEEF0] bg-white/80 p-3 md:rounded-[20px] md:p-5"
              >
                <h3 className="text-[16px] font-medium leading-[1.5] text-[#D3793D] md:text-[20px]">
                  {point.title}
                </h3>
                <div className="mt-1 text-[13px] leading-[1.9] tracking-[0.02em] text-[#6A7378] md:mt-2 md:text-[16px]">
                  {point.description.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <p className="my-6 text-[15px] leading-[2] tracking-[0.04em] text-[#4B5459] md:my-9 md:text-[18px]">
            大学生活への不安や勉強のコツなど、どんなに些細なことでも構いません。卒展に足を運ぶついでに、この機会にぜひ現役生のリアルな声を聴きに来てください！
          </p>

          <article className="rounded-[12px] border border-[#EBEEF0] bg-white/80 p-3 md:rounded-[20px] md:p-5">
            <div className="flex items-center gap-2">
              <InfoIcon />
              <p className="text-[13px] font-medium leading-[1.5] text-[#2E3437] md:text-[15px]">
                本イベントに関する注意事項
              </p>
            </div>
            <ul className="mt-1 list-disc pl-5 text-[13px] leading-[1.9] tracking-[0.02em] text-[#6A7378] md:mt-2 md:text-[16px] md:tracking-[0.02em]">
              <li>開始時間の10分前から受付を開始します。</li>
              <li>
                当日の状況により、プログラム内容やスケジュールが一部変更になる可能性がございます。
              </li>
              <li>予約不要の為、当日時間になりましたらお集まりください。</li>
            </ul>
          </article>
        </section>

        <section
          data-reveal
          className="mx-auto w-full px-4 pb-8 md:max-w-[1280px] md:px-[128px] md:pb-[48px]"
        >
          <div className="border-b border-[#D3793D] pb-2">
            <h2 className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
              参加予約・スケジュール
            </h2>
          </div>

          <p className="mt-2 text-[15px] leading-[2] tracking-[0.04em] text-[#4B5459] md:mt-3 md:text-[18px]">
            こちらのイベントは参加予約不要となります。当日時間になりましたら、本部棟6階オープンラボにお集まりください。
          </p>

          <ul className="mt-2 space-y-1 text-[15px] leading-loose tracking-[0.04em] text-[#4B5459] md:mt-6 md:text-[18px]">
            <li>15:20〜 受付開始</li>
            <li>15:30〜 開会</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function BackChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9.5 3.5L5 8L9.5 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" stroke="#D3793D" strokeWidth="1.8" />
      <path
        d="M12 12.4V16"
        stroke="#D3793D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8.6" r="1" fill="#D3793D" />
    </svg>
  );
}
