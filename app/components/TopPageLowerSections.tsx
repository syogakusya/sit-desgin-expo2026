"use client";

import Link from "next/link";
import { useState } from "react";

import CareerPieChart from "./CareerPieChart";
import Footer from "./Footer";

type CareerStats = {
  total: number;
  gradCount: number;
  jobCount: number;
  otherCount: number;
};

type TopPageLowerSectionsProps = {
  careerStats: CareerStats;
};

type WeekendLimitedEvent = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  ariaLabel?: string;
};

// 変更理由: 遅延マウント側へ切り出したセクションでのみ使う定数を分離し、
// 初回表示ブロックに不要な責務を持たせないため、下層コンポーネント側で定義します。
const sitMapImageUrl = "/image/sit_map.webp";
const eventBackgroundUrl = "/image/background/event_background.png";

// 土日限定イベントのカード情報はイベントページと揃え、トップ側も同じ内容をカード表示します。
const weekendLimitedEvents: WeekendLimitedEvent[] = [
  {
    id: "osekkai",
    title: "【高校生向け】 デザイン工学部なんでも相談会-OSEKKAI-",
    description:
      "現役生によるデザイン工学部なんでも相談会です！学部4年生以上が参加しますのでこの機会にたくさん質問してください。",
    imageSrc: "/image/osekkai.webp",
    imageAlt: "OSEKKAIのイベントバナー",
    // 変更理由: 実際の公開URL(/events/farewell-lecture)に導線を統一し、
    // トップカード遷移とSNS共有URLの不一致を防ぎます。
    href: "/events/farewell-lecture",
    ariaLabel: "デザイン工学部なんでも相談会-OSEKKAI-ページへ",
  },
  {
    id: "osekkai-ii",
    title: "【デザ工1,2年生向けイベント】デザイン工学部なんでも相談会-OSEKKAⅡ-",
    description:
      // 変更理由: OSEKKAⅡ詳細ページと同じ訴求文に揃え、トップカードから遷移した際の文言ギャップを防ぎます。
      "豊洲キャンパスに通うデザイン工学部の先輩達が、皆さんのお悩みにお答えする相談会です！学部4年生以上が参加しますのでこの機会にたくさん相談してください。",
    // 変更理由: トップページのイベントセクションにも OSEKKAII カードを追加し、
    // Figmaノード(1228:14268 / 1947:8072)の3カード構成と遷移導線を一致させるためです。
    imageSrc: "/image/osekkai2.webp",
    imageAlt: "【デザ工1,2年生向けイベント】デザイン工学部なんでも相談会 OSEKKAⅡ",
    href: "/events/osekkai-ii",
    ariaLabel:
      "【デザ工1,2年生向けイベント】デザイン工学部なんでも相談会-OSEKKAⅡ-ページへ",
  },
  {
    id: "farewell-lecture",
    title: "退職される先生の最終講義と懇親会",
    description:
      "2025年度をもって芝浦工業大学を退職される、島田明先生・吉武良治先生の最終講義および懇親会を実施します。",
    imageSrc: "/image/event-image.png",
    imageAlt: "退職される先生の最終講義と懇親会",
    // 変更理由: トップページの懇親会カードを押した際、イベント一覧ではなく懇親会詳細ページへ直接遷移させるためリンク先を明示します。
    href: "/events/konsinkai",
    ariaLabel: "退職される先生の最終講義と懇親会ページへ",
  },
];

export default function TopPageLowerSections({
  careerStats,
}: TopPageLowerSectionsProps) {
  const [isGuideVideoModalOpen, setIsGuideVideoModalOpen] = useState(false);

  // 進路データはサーバー側で集計済みの値を受け取り、表示用に割合へ変換します。
  const totalCareers = careerStats.total;
  const gradPercent =
    totalCareers === 0 ? 0 : (careerStats.gradCount / totalCareers) * 100;
  const jobPercent =
    totalCareers === 0 ? 0 : (careerStats.jobCount / totalCareers) * 100;
  const otherPercent =
    totalCareers === 0 ? 0 : (careerStats.otherCount / totalCareers) * 100;

  // 駅導線ボタンを押したときは外部遷移せず、準備中案内をモーダルで表示します。
  const handleGuideVideoClick = () => {
    setIsGuideVideoModalOpen(true);
  };

  // モーダルを閉じる処理を共通化し、背景クリック・閉じるボタンの両方で再利用します。
  const handleCloseGuideVideoModal = () => {
    setIsGuideVideoModalOpen(false);
  };

  return (
    <>
      {/* イベント紹介は上下余白を設け、指定画像を背景に使い雰囲気を合わせます。 */}
      {/* イベント背景はFigmaの淡いグレーをベースにし、背景画像で質感を足します。 */}
      <section
        data-reveal
        // 変更理由: OSEKKAIIカード追加でイベントカードが3枚構成になり、固定高さだと最下段カードとボタンが見切れるため、
        // セクション高は内容量に追従する可変に変更します。Figmaの高さは最小高さとして保持し、余白設計は維持します。
        className="relative isolate min-h-[1098.125px] overflow-x-clip px-4 py-12 md:min-h-[1040px] md:px-8 lg:px-[128px] md:py-[128px]"
      >
        {/* 土日限定イベントの背景もフルブリードにし、左右の余白で画像が途切れないようにします。 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-[100dvw] max-w-[100dvw] -translate-x-1/2 bg-[#EBEEF0]"
          style={{
            backgroundImage: `url('${eventBackgroundUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="mx-auto md:max-w-[1024px]">
          <div className="border-b border-[#FB9678] pb-1 md:flex md:justify-center">
            <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.04em]">
              土日限定のイベント
            </p>
          </div>
          {/* タイトル下の本文はBodyLに合わせ、サイズと行間を一段上げます。 */}
          <p className="mt-4 text-[15px] leading-[2] text-[#4B5459] md:text-center md:text-[16px] md:leading-[2] md:tracking-[0.04em]">
            卒業生と直接コミュニケーションをとることができる座談会や、体験展示イベントを予定しています。
          </p>
          {/* 土日限定イベントはイベントページと同じカード構成に揃え、トップでも概要を確認できるようにします。 */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {weekendLimitedEvents.map((event) => (
              <TopWeekendLimitedEventCard key={event.id} event={event} />
            ))}
          </div>
          {/* モバイルはボタン下の余白を少し足します。 */}
          <div className="mt-6 flex justify-center pb-4 md:pb-0">
            <Link
              href="/events"
              // 有色ボタンはFigmaのホバー仕様に合わせ、白グラデーションを重ねて300msで明るく見せます。
              className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background,box-shadow] duration-300 ease-in-out hover:[background:linear-gradient(108.58deg,rgba(255,255,255,0.20)_0.58%,rgba(255,255,255,0.15)_47.57%,rgba(255,255,255,0.10)_94.56%),#D3793D] hover:[background-blend-mode:plus-lighter] md:px-[56px] md:py-[20px]"
            >
              イベントを見る
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 進路情報はイベントの後に配置し、Figmaの2カラム構成を再現します。 */}
      <section
        data-reveal
        className="relative bg-[#F9F9F9] px-4 py-12 md:px-8 lg:px-[128px] md:py-[128px]"
      >
        {/* 装飾画像の配置ルールに合わせ、dotgridはdecorationフォルダから参照します。 */}
        <div className="pointer-events-none absolute right-6 top-6 hidden md:block md:right-[128px] md:top-[48px]">
          <img
            src="/image/decoration/dotgrid.svg"
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="h-[144px] w-[192px]"
          />
        </div>
        {/* PC表示のみの円装飾も、他装飾と同じdecorationフォルダ配下から読み込みます。 */}
        <div className="pointer-events-none absolute left-70 top-110 hidden -translate-x-1/3 -translate-y-1/2 md:block">
          <img
            src="/image/decoration/circle.svg"
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="h-[320px] w-[320px]"
          />
        </div>

        <div className="mx-auto md:max-w-[1024px]">
          <div className="mt-4 flex flex-col gap-8 md:mt-0 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start md:gap-[64px] lg:grid-cols-[480px_480px]">
            <div className="flex w-full flex-col md:min-h-[463px]">
              {/* タイトル直下の本文は上詰めに固定し、下段の余白は別コンテナで扱います。 */}
              <div>
                {/* 見出し下の線は左カラム幅に合わせ、右側にグラフが来る構成にします。 */}
                <div className="border-b-2 border-[#FB9678] pb-1">
                  <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
                    卒業生の進路
                  </p>
                </div>
                {/* タイトル下の本文はBodyLに合わせ、サイズと行間を一段上げます。 */}
                <p className="mt-4 text-[15px] leading-[2] text-[#4B5459] md:text-[16px] md:leading-[2] md:tracking-[0.04em]">
                  卒業生のほとんどは本学大学院への進学、もしくは就職をしています。就職をする学生は、多くがデザイナーやエンジニアとして活躍予定です。
                </p>
                {/* Figma指定に合わせ、PCのみ本文下へ12px注釈を配置して進路データの母集団差分を明示します。 */}
                <p className="mt-4 hidden text-[12px] leading-[1.6] tracking-[0.02em] text-[#6A7378] md:block">
                  ※卒業・修了研究展に出展する学生の進路の割合です。デザイン工学部全体の進路の割合とは異なる可能性があります。
                </p>
              </div>
              {/* PCのみ、残り高さの中央にボタンを配置してFigmaのバランスに合わせます。 */}
              <div className="mt-6 hidden md:flex md:flex-1 md:items-center md:justify-center">
                <Link
                  href="/career"
                  // 有色ボタンはFigmaのホバー仕様に合わせ、白グラデーションを重ねて300msで明るく見せます。
                  className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background,box-shadow] duration-300 ease-in-out hover:[background:linear-gradient(108.58deg,rgba(255,255,255,0.20)_0.58%,rgba(255,255,255,0.15)_47.57%,rgba(255,255,255,0.10)_94.56%),#D3793D] hover:[background-blend-mode:plus-lighter]"
                >
                  進路をもっと詳しく
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            {/* 中間幅のデスクトップでは右カラムが縮むため、要素がはみ出さないよう幅を可変にします。 */}
            <div className="flex w-full justify-center md:justify-end">
              <CareerPieChart
                gradPercent={gradPercent}
                jobPercent={jobPercent}
                otherPercent={otherPercent}
                total={totalCareers}
              />
            </div>
          </div>
          {/* FigmaのSP版は注釈がグラフ下にあるため、モバイルのみ同文言を同タイポグラフィで表示します。 */}
          <p className="mt-4 text-[12px] leading-[1.6] tracking-[0.02em] text-[#6A7378] md:hidden">
            ※卒業・修了研究展に出展する学生の進路の割合です。デザイン工学部全体の進路の割合とは異なる可能性があります。
          </p>
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href="/career"
              // 有色ボタンはFigmaのホバー仕様に合わせ、白グラデーションを重ねて300msで明るく見せます。
              className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background,box-shadow] duration-300 ease-in-out hover:[background:linear-gradient(108.58deg,rgba(255,255,255,0.20)_0.58%,rgba(255,255,255,0.15)_47.57%,rgba(255,255,255,0.10)_94.56%),#D3793D] hover:[background-blend-mode:plus-lighter]"
            >
              進路をもっと詳しく
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 開催場所はFigma更新に合わせ、ガイド動画を同セクション内へ統合します。 */}
      <section
        data-reveal
        className="bg-[#F9F9F9] px-4 py-12 md:px-8 lg:px-[128px] md:py-[128px]"
      >
        <div className="mx-auto flex flex-col gap-4 md:max-w-[1024px]">
          {/* 見出しは白背景+下線の構成に揃え、サイズはFigmaの20pxで固定します。 */}
          <div className="w-full border-b-2 border-[#FB9678] py-1">
            {/* デスクトップのみ、開催場所の見出しテキストを中央揃えにします。 */}
            <p className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-center">
              開催場所
            </p>
          </div>

          {/* 平日・土日の説明カードは、Figmaの共通コンポーネント（白80%背景＋薄枠＋角丸）に揃えます。 */}
          <div className="flex flex-col gap-3 md:flex-row md:gap-6">
            <div className="rounded-[12px] border border-[#EBEEF0] bg-[rgba(255,255,255,0.8)] p-3 text-left md:flex-1 md:items-center md:text-center">
              <p className="text-[16px] font-medium leading-[1.5] text-[#D3793D] md:text-center">
                平日
              </p>
              {/* 要望に合わせて「有元史郎記念校友会館」の文言を削除し、交流プラザ表記へ統一します。 */}
              <p className="mt-1 text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-center">
                交流プラザにて研究の展示をします。
                <br className="hidden md:block" />
                展示されている研究の一覧は
                <Link href="/research" className="text-[#D3793D] underline">
                  こちら
                </Link>
                から。
              </p>
            </div>
            <div className="rounded-[12px] border border-[#EBEEF0] bg-[rgba(255,255,255,0.8)] p-3 text-left md:flex-1 md:items-center md:text-center">
              <p className="text-[16px] font-medium leading-[1.5] text-[#D3793D] md:text-center">
                土日
              </p>
              <p className="mt-1 text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-center">
                平日の研究展示に加え、各種イベントを実施します。
                <br className="hidden md:block" />
                実施するイベントの詳細は
                <Link href="/events" className="text-[#D3793D] underline">
                  こちら
                </Link>
                から。
              </p>
            </div>
          </div>

          {/* ガイド動画は開催場所セクション内へ移動し、FigmaのBody/Mに合わせてSP/PCとも説明文を13pxで統一します。 */}
          <div className="w-full py-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#DDE1E4]" />
              <p className="text-[16px] font-medium tracking-[0.15em] text-[#D3793D] [font-family:var(--font-roboto)]">
                GUIDE VIDEOS
              </p>
              <span className="h-px flex-1 bg-[#DDE1E4]" />
            </div>
            <p className="mt-2 text-center text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459]">
              大学への行き方動画はこちらから！
              <br />
              （Youtubeに遷移します。）
            </p>
            {/* SP/PCともに2ボタンを横並びにし、Figmaの線ボタン見た目を維持します。 */}
            {/* 駅動画ボタンは白塗り(デフォルト)→オレンジ塗り(hover)を明確にするため、重ね白レイヤーを使わず背景色遷移のみで表現します。 */}
            <div className="mt-4 flex items-center gap-4 md:justify-center md:gap-6 md:px-12">
              <button
                type="button"
                onClick={handleGuideVideoClick}
                // 枠線ボタンはFigma仕様に合わせ、300msのイースイン・イースアウトで塗りと文字色を反転します。
                className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-[#FB9678] bg-[#FFFFFF] px-6 py-4 text-[13px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background-color,color,border-color] duration-300 ease-in-out hover:bg-[#D3793D] hover:text-[#F9F9F9] md:max-w-[352px]"
              >
                <span className="relative z-10">豊洲駅から</span>
                <img
                  src="/icon/link.svg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="relative z-10 h-4 w-4 transition-[filter] duration-300 ease-in-out group-hover:brightness-0 group-hover:invert"
                />
              </button>
              <button
                type="button"
                onClick={handleGuideVideoClick}
                // 枠線ボタンはFigma仕様に合わせ、300msのイースイン・イースアウトで塗りと文字色を反転します。
                className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-[#FB9678] bg-[#FFFFFF] px-6 py-4 text-[13px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background-color,color,border-color] duration-300 ease-in-out hover:bg-[#D3793D] hover:text-[#F9F9F9] md:max-w-[352px]"
              >
                <span className="relative z-10">越中島駅から</span>
                <img
                  src="/icon/link.svg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="relative z-10 h-4 w-4 transition-[filter] duration-300 ease-in-out group-hover:brightness-0 group-hover:invert"
                />
              </button>
            </div>
          </div>

          {/* SIT MAPは背景カードを廃止し、見出し線＋説明＋地図のみの構成へ変更します。 */}
          <div className="w-full py-6">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#DDE1E4]" />
              <p className="text-[16px] font-medium tracking-[0.15em] text-[#D3793D] [font-family:var(--font-roboto)]">
                SIT MAP
              </p>
              <span className="h-px flex-1 bg-[#DDE1E4]" />
            </div>
            {/* 参照ノード(1622:5254/1622:5255)のBody/M仕様に合わせ、SIT MAP下もSP/PCとも13pxを維持します。 */}
            <p className="mt-2 text-center text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459]">
              開催場所の交流プラザの位置はこちらです。
            </p>
            <div className="mt-4 overflow-hidden">
              <img
                src={sitMapImageUrl}
                alt="豊洲キャンパス構内の配置図"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* アクセスはFigma通り、上部が白系・下部がグレー系へ落ちる縦グラデ背景に変更します。 */}
      <section
        data-reveal
        className="bg-[#F9F9F9] px-4 py-12 md:px-8 lg:px-[128px] md:py-[128px]"
      >
        <div className="mx-auto md:max-w-[1024px]">
          {/* デスクトップは「卒業生の進路」と同様に、見出し線を中間幅で止めて右に地図を配置します。 */}
          <div className="mt-4 flex flex-col gap-6 md:mt-0 lg:grid lg:grid-cols-[480px_480px] lg:items-start lg:gap-[64px]">
            <div>
              {/* 見出し下の線は下のテキストボックス幅に揃えるため、固定幅ではなく左カラム全幅に合わせます。 */}
              <div className="w-full border-b-2 border-[#FB9678] pb-1">
                <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.04em]">
                  アクセス
                </p>
              </div>
              <div className="mt-4">
                <p className="text-[13px] leading-[1.9] text-[#4B5459] md:text-[16px] md:tracking-[0.04em]">
                  〒135-8548 東京都江東区豊洲3-7-5
                </p>
                <p className="mt-2 text-[13px] leading-[1.9] text-[#4B5459] md:text-[16px] md:tracking-[0.04em]">
                  東京メトロ有楽町線「豊洲駅」１cまたは３番出口から徒歩７分
                  <br />
                  ゆりかもめ「豊洲駅」から徒歩９分
                  <br />
                  JR京葉線「越中島駅」２番出口から徒歩15分
                </p>
              </div>
            </div>
            <div className="overflow-hidden lg:mt-0">
              {/* 指定されたGoogle Mapsの埋め込みコードをそのまま使用し、表示領域をレスポンシブに調整します。 */}
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.6646539508483!2d139.79262397577705!3d35.6606329725939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601889a0774db467%3A0x341667956857f1f8!2z44CSMTM1LTg1NDgg5p2x5Lqs6YO95rGf5p2x5Yy66LGK5rSy77yT5LiB55uu77yX4oiS77yVIOiKnea1puW3pealreWkp-WtpiDosYrmtLLjgq3jg6Pjg7Pjg5Hjgrk!5e0!3m2!1sja!2sjp!4v1770220456567!5m2!1sja!2sjp"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[209px] w-full md:h-[278px]"
                title="芝浦工業大学 豊洲キャンパスの地図"
              />
            </div>
          </div>
        </div>
      </section>

      {/* フッターは既存コンポーネントを使用し、SNS導線をまとめます。 */}
      {/* 変更理由: デスクトップで `md:max-w-[1280px]` が効くとフッター自体の横幅が制限されるため、 */}
      {/* ラッパーの最大幅制限を外して常に画面幅いっぱいへ広げます。 */}
      <div className="px-0 pt-12 md:px-0 md:pt-[48px]">
        <Footer className="w-full" />
      </div>

      {/* 駅ガイド動画が未完成のため、クリック時はページ遷移ではなく準備中モーダルを表示します。 */}
      {isGuideVideoModalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2E3437]/55 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-video-modal-title"
          onClick={handleCloseGuideVideoModal}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-[#F9F9F9] p-6 text-center shadow-[0_0_16px_rgba(46,52,55,0.2)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <p
              id="guide-video-modal-title"
              className="text-[24px] font-extrabold tracking-[0.04em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]"
            >
              現在準備中
            </p>
            <p className="mt-3 text-[14px] leading-[1.9] text-[#4B5459] md:text-[15px]">
              駅から大学までの行き方動画は現在準備中です。
              <br />
              公開まで今しばらくお待ちください。
            </p>
            <button
              type="button"
              onClick={handleCloseGuideVideoModal}
              // 変更理由: 「閉じる」の意味をより直感的に伝えるため、右側アイコンをマイナスではなく×表示に統一します。
              className="mt-6 mx-auto flex min-w-[140px] items-center justify-center rounded-full border border-[#A3ADB2] bg-[#F9F9F9] px-8 py-3 text-[14px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background-color,color,border-color] duration-300 ease-in-out hover:bg-[#4B5459] hover:text-[#F9F9F9] md:text-[15px]"
            >
              <span className="inline-flex items-center justify-center gap-2">
                閉じる
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path d="M7 7L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M17 7L7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TopWeekendLimitedEventCard({ event }: { event: WeekendLimitedEvent }) {
  const cardContent = (
    <article className="group flex h-full flex-col gap-3 rounded-[12px] border border-[#EBEEF0] bg-white/80 p-4 shadow-[0_0_8px_rgba(106,115,120,0.1)] md:gap-5 md:rounded-[20px] md:p-6">
      <img
        src={event.imageSrc}
        alt={event.imageAlt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        className="aspect-[1920/1080] w-full rounded-[8px] object-cover md:rounded-[12px]"
      />
      <div className="flex flex-col gap-1 md:gap-2">
        <h2 className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] transition-colors duration-200 group-hover:text-[#D3793D] group-active:text-[#D3793D]">
          {event.title}
        </h2>
        {/* 本文は2行で打ち切り、カード間の高さ差を抑えて整列を維持します。 */}
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
          <TopEventChevronRightIcon />
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
      className="block rounded-[12px] outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#FB9678] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EBEEF0] md:rounded-[20px]"
    >
      {cardContent}
    </Link>
  );
}

function TopEventChevronRightIcon() {
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
