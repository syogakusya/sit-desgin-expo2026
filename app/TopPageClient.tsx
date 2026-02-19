"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import CareerPieChart from "./components/CareerPieChart";
import Footer from "./components/Footer";
import GlobalHeader from "./components/GlobalHeader";
import useSectionReveal from "./components/useSectionReveal";

// トップページの構成要素をまとめて管理し、Figmaの階層と同じ順番で描画します。
type CareerStats = {
  total: number;
  gradCount: number;
  jobCount: number;
  otherCount: number;
};

type TopPageClientProps = {
  careerStats: CareerStats;
  previewItems: PreviewItem[];
};

type PreviewItem = {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  href: string;
  kind: "research" | "works";
};

// SIT MAPの画像は公開フォルダ内の最新版を参照します。
const sitMapImageUrl = "/image/sit_map.png";
// 「卒業・修了研究展とは」セクションの装飾は、公開フォルダのSVGに集約して読み込みます。
// 以前のFigmaアセット分割をやめて1枚絵にまとめることで、配置調整と管理コストを下げます。
const exhibitionDecorationLeftUrl = "/image/top-decoration1.svg";
const exhibitionDecorationRightUrl = "/image/top-decoration2.svg";
// 研究・作品紹介の装飾はトップ専用のSVGに切り替えます。
const worksDecorationPrimaryUrl = "/image/top-decoration4.svg";
const worksDecorationSecondaryUrl = "/image/top-decoration3.svg";
// コンセプト背景はローカルの単一画像に統一します。
const conceptBackgroundUrl = "/image/concept.png";

export default function TopPageClient({
  careerStats,
  previewItems,
}: TopPageClientProps) {
  const [kvComplete, setKvComplete] = useState(false);
  useEffect(() => {
    if (document.body.dataset.keyvisualComplete === "1") {
      setKvComplete(true);
      return;
    }
    const handler = () => setKvComplete(true);
    window.addEventListener("keyvisual:complete", handler);
    return () => window.removeEventListener("keyvisual:complete", handler);
  }, []);

  const [isGuideVideoModalOpen, setIsGuideVideoModalOpen] = useState(false);
  // 進路データはサーバー側で集計済みの値を受け取り、表示用に割合へ変換します。
  const totalCareers = careerStats.total;
  const gradPercent =
    totalCareers === 0 ? 0 : (careerStats.gradCount / totalCareers) * 100;
  const jobPercent =
    totalCareers === 0 ? 0 : (careerStats.jobCount / totalCareers) * 100;
  const otherPercent =
    totalCareers === 0 ? 0 : (careerStats.otherCount / totalCareers) * 100;

  // 開催開始日（2026年3月7日）までの残り日数を、ローカル日付の0時基準で計算します。
  const eventStartDate = new Date(2026, 2, 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventStartDate.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEvent = Math.max(
    0,
    Math.ceil((eventStartDate.getTime() - today.getTime()) / msPerDay),
  );

  // データ未登録時でもレイアウトが崩れないよう、フォールバック用の表示データを準備します。
  const fallbackPreviewItems: PreviewItem[] = Array.from({ length: 3 }).map(
    (_, index) => ({
      id: `preview-${index}`,
      title:
        "研究または作品タイトルが入ります。研究または作品タイトルが入ります。",
      author: "苗字 名前",
      imageUrl: "/image/preview.png",
      href: "/research",
      kind: "research",
    }),
  );
  const visiblePreviewItems =
    previewItems.length > 0 ? previewItems : fallbackPreviewItems;
  // モバイルのスライドは1枚ずつ切り替えるため、現在表示するカードのインデックスを持ちます。
  const [mobilePreviewIndex, setMobilePreviewIndex] = useState(0);
  // アニメーションを毎回発火させるため、切り替えごとにキーを更新します。
  const [mobilePreviewKey, setMobilePreviewKey] = useState(0);
  // モバイル表示は一定間隔で順番にカードを切り替えます。
  useEffect(() => {
    if (visiblePreviewItems.length <= 1) {
      return;
    }
    // アニメーションの尺(6000ms)と同期させて、切り替えのタイミングを揃えます。
    const intervalId = window.setInterval(() => {
      setMobilePreviewIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % visiblePreviewItems.length;
        return nextIndex;
      });
      setMobilePreviewKey((prevKey) => prevKey + 1);
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [visiblePreviewItems.length]);
  // トップページの各セクションにスクロール時のスライドインを付与します。
  useSectionReveal();
  // プレビュー件数が減ったときに範囲外にならないよう、表示時に安全なインデックスへ補正します。
  // Effect内でsetStateしないことで、不要な再レンダーの連鎖を避けます。
  const safeMobilePreviewIndex =
    mobilePreviewIndex >= visiblePreviewItems.length ? 0 : mobilePreviewIndex;
  const mobilePreviewItem =
    visiblePreviewItems[safeMobilePreviewIndex] ?? visiblePreviewItems[0];
  // 左右のカードを表示するため、前後のインデックスもここで算出しておきます。
  const hasMultiplePreviews = visiblePreviewItems.length > 1;
  // 2件以下だと左右カードが同一になりやすいので、3件以上の時だけ左右カードを出します。
  const hasSidePreviews = visiblePreviewItems.length > 2;
  const mobilePrevIndex =
    (safeMobilePreviewIndex - 1 + visiblePreviewItems.length) %
    visiblePreviewItems.length;
  const mobileNextIndex =
    (safeMobilePreviewIndex + 1) % visiblePreviewItems.length;
  const mobilePrevItem = visiblePreviewItems[mobilePrevIndex];
  const mobileNextItem = visiblePreviewItems[mobileNextIndex];

  // 駅導線ボタンを押したときは外部遷移せず、準備中案内をモーダルで表示します。
  const handleGuideVideoClick = () => {
    setIsGuideVideoModalOpen(true);
  };

  // モーダルを閉じる処理を共通化し、背景クリック・閉じるボタンの両方で再利用します。
  const handleCloseGuideVideoModal = () => {
    setIsGuideVideoModalOpen(false);
  };

  return (
    // 画面が短いときでもフッターが下端に揃うよう、最小高さを確保します。
    // モバイルは横幅いっぱいに広げるため、最大幅の制限はmd以上に限定します。
    <div className="mx-auto flex min-h-screen w-full flex-col bg-[#F9F9F9]">
      {/* デスクトップは横幅のみ広げ、シングルカラムの構成は維持します。 */}
      {/* 全ページ共通のヘッダーを配置し、スクロール中も固定表示します。 */}
      <GlobalHeader activeId="top" hidden={!kvComplete} />

      <div className="mx-auto w-full bg-linear-to-b from-[#F9F9F9] to-[#EBEEF0]"  id="top-page-content">
        {/* 開催情報カードはFigmaの角丸・影・配色をそのまま移植します。 */}
        <section
          data-reveal
          className="px-4 pb-6 pt-6 md:px-8 lg:px-[128px] md:pb-[128px] md:pt-[128px]"
        >
          <div className="mx-auto rounded-[24px] bg-[#F9F9F9] p-6 shadow-[0_0_8px_rgba(106,115,120,0.15)] md:max-w-[1024px] md:p-9">
            {/* モバイル・デスクトップともに見出しを中央寄せにして視線が散らないようにします。 */}
            <div className="border-b border-[#FB9678] pb-1 text-center">
              <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.04em]">
                開催情報
              </p>
            </div>
            <div className="mt-4 flex flex-col items-center gap-4 text-center md:mt-8 md:gap-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-[24px] font-extrabold text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[32px]">
                  3.07
                  <span className="text-[16px] text-[#2C68D3]">(土)</span>
                  <span className="mx-1 text-[24px] text-[#A3ADB2]">-</span>
                  3.17
                  <span className="text-[16px] text-[#6A7378]">(火)</span>
                </p>
                <p className="text-[13px] font-medium text-[#6A7378] md:text-[15px]">
                  芝浦工業大学 豊洲キャンパス 交流プラザ
                </p>
              </div>
              <div className="flex items-center gap-4 text-center">
                <div className="w-[124px]">
                  <p className="text-[10px] text-[#9BA3A7] md:text-[12px]">
                    開催時間
                  </p>
                  <p className="text-[16px] font-extrabold text-[#4B5459] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
                    10:00 - 17:00
                  </p>
                </div>
                <div className="h-[31.5px] w-px bg-[#DDE1E4]" />
                <div className="w-[124px]">
                  <p className="text-[10px] text-[#9BA3A7] md:text-[12px]">
                    入場料
                  </p>
                  <p className="text-[16px] font-extrabold text-[#4B5459] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
                    無料
                  </p>
                </div>
              </div>
              <div className="w-full rounded-full bg-gradient-to-r from-[#FB9678] to-[#E5A967] px-8 py-2 text-center text-[#F9F9F9] md:w-[280px] md:px-[56px] md:py-[12px]">
                <span className="text-[13px] md:text-[15px]">開催まであと </span>
                <span className="text-[24px] font-extrabold [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
                  {daysUntilEvent}
                </span>
                <span className="text-[13px] font-bold md:text-[15px]">日</span>
              </div>
            </div>
          </div>
        </section>

        {/* 卒業・修了研究展セクションはFigmaの装飾と本文の改行を忠実に再現します。 */}
        {/* モバイルで各セクションの下余白を広げて読みやすさを確保します（下方向のみ増やす）。 */}
        <section
          data-reveal
          className="relative overflow-hidden px-4 pb-20 pt-12 md:px-8 lg:px-[128px] md:py-[128px]"
        >
          {/* 左上装飾は一枚SVGに置き換え、Figmaの配置と見た目を固定化します。 */}
          <div className="pointer-events-none absolute left-0 top-0 hidden h-[389px] w-[550px] overflow-hidden md:block">
            <img
              alt=""
              src={exhibitionDecorationLeftUrl}
              className="block h-full w-full"
            />
          </div>

          {/* 右側装飾も一枚SVGに置き換え、本文領域と干渉しない位置に固定します。 */}
          <div className="pointer-events-none absolute right-0 top-[169px] hidden h-[471px] w-[450px] overflow-hidden md:block">
            <img
              alt=""
              src={exhibitionDecorationRightUrl}
              className="block h-full w-full"
            />
          </div>

          {/* モバイルは右上装飾のみ表示し、視線の主導権を本文に戻します。 */}
          <div className="pointer-events-none absolute left-[-57px] top-[79.33px] h-[471px] w-[450px] overflow-hidden md:hidden">
            <img
              alt=""
              src={exhibitionDecorationRightUrl}
              className="block h-full w-full"
            />
          </div>

          <div className="relative mx-auto md:max-w-[1024px]">
            <div className="flex items-center justify-center px-4 py-1 md:px-4">
              <p className="text-[32px] font-extrabold leading-[1.5] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
                卒業・修了研究展とは
              </p>
            </div>

            {/* デスクトップ本文は改行位置と文言をFigmaに合わせています。 */}
            <div className="hidden px-4 pt-4 md:flex md:justify-center">
              <div className="max-w-[768px] text-center text-[18px] leading-[2.2] tracking-[0.6px] text-[#4B5459] [font-family:'Noto_Sans_JP',sans-serif]">
                <p className="mb-0">芝浦工業大学デザイン工学部の学生による、</p>
                <p className="mb-0">それぞれの研究を展示する場です。</p>
                <p className="mb-0 text-[15px]">&nbsp;</p>
                <p className="mb-0">
                  ここには、プロダクト・システム・UXなど、デザイン工学という広い領域における多様な研究が集まります。
                </p>
                <p className="mb-0 text-[15px]">&nbsp;</p>
                <p>
                  具体的な物として展示されるものもあれば、形のないシステムやアプリの提案、あるいは思考や概念などさまざまな研究があります。学生一人ひとりが積み上げてきた探求の軌跡を、ありのままに展示する空間です。
                </p>
              </div>
            </div>

            {/* モバイル本文はFigmaの改行と文言をそのまま反映します。 */}
            <div className="px-4 pt-4 md:hidden">
              <div className="text-[15px] leading-[2.2] tracking-[0.6px] text-[#4B5459] [font-family:'Noto_Sans_JP',sans-serif]">
                <p className="mb-0">芝浦工業大学デザイン工学部の学生による、</p>
                <p className="mb-0">それぞれの研究を展示する場です。</p>
                <p className="mb-0 text-[15px]">&nbsp;</p>
                <p className="mb-0">
                  ここには、プロダクト・システム・UXなど、デザイン工学という広い領域における多様な研究が集まります。
                </p>
                <p className="mb-0 text-[15px]">&nbsp;</p>
                <p>
                  具体的な物として展示されるものもあれば、形のないシステムやアプリの提案、あるいは思考や概念などさまざまな研究があります。学生一人ひとりが積み上げてきた探求の軌跡を、ありのままに展示する空間です。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* コンセプトは背景のレイヤーと改行位置をFigma通りに合わせます。 */}
      {/* モバイルの下余白を少し広げ、次セクションとの間隔を確保します。 */}
      <section
        data-reveal
        className="relative mt-0 overflow-hidden px-4 pb-20 pt-12 md:mt-0 md:px-8 lg:px-[128px] md:py-[96px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {/* デスクトップ/モバイル共通で同一の背景画像を使用します。 */}
          <img
            alt=""
            src={conceptBackgroundUrl}
            className="absolute h-full w-full object-cover"
          />
        </div>
        <div className="relative flex flex-col items-center gap-4 md:gap-6">
          <div className="flex w-full flex-col items-center py-1 md:py-2">
            <p className="text-[16px] font-extrabold leading-[1.5] text-[#EBEEF0] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
              CONCEPT
            </p>
            <p className="text-[48px] font-extrabold leading-[1.5] tracking-[0.96px] text-[#F9F9F9] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[56px] md:tracking-[1.12px]">
              接点
            </p>
          </div>

          {/* デスクトップ本文 */}
          <div className="hidden w-full px-[128px] text-center md:block">
            <div className="text-[18px] leading-[2.2] tracking-[0.72px] text-[#F9F9F9] [font-family:'Noto_Sans_JP',sans-serif]">
              <p className="mb-0">
                卒展は、来場者と研究の接点となるだけでなく、
              </p>
              <p className="mb-0 text-[18px]">&nbsp;</p>
              <p className="mb-0">研究と社会の仕組み、</p>
              <p className="mb-0">研究と過去の経験、</p>
              <p className="mb-0">研究と新たに生まれる可能性、</p>
              <p className="mb-0 text-[18px]">&nbsp;</p>
              <p className="mb-0">
                など接点を持ちうる様々な要素に囲まれている。
              </p>
              <p className="mb-0">
                客観的に見た卒展は、そういった外部の接点を多様に持ち、
                様々な接点の上で成り立っている。
              </p>
              <p className="mb-0 text-[18px]">&nbsp;</p>
              <p>
                そんな卒展を覗くと、たくさんのアイデアにあふれていて、
                来場者も自分なりに研究との接点を見つけられる空間が広がっている。
              </p>
            </div>
          </div>

          {/* モバイル本文 */}
          <div className="w-full text-center md:hidden">
            <div className="text-[15px] leading-[2.2] tracking-[0.6px] text-[#F9F9F9] [font-family:'Noto_Sans_JP',sans-serif]">
              <p className="mb-0">
                卒展は、来場者と研究の接点となるだけでなく、
              </p>
              <p className="mb-0 text-[15px]">&nbsp;</p>
              <p className="mb-0">研究と社会の仕組み、</p>
              <p className="mb-0">研究と過去の経験、</p>
              <p className="mb-0">研究と新たに生まれる可能性、</p>
              <p className="mb-0 text-[15px]">&nbsp;</p>
              <p className="mb-0">
                など接点を持ちうる様々な要素に囲まれている。
              </p>
              <p className="mb-0">
                客観的に見た卒展は、そういった外部の接点を多様に持ち、
                様々な接点の上で成り立っている。
              </p>
              <p className="mb-0 text-[15px]">&nbsp;</p>
              <p>
                そんな卒展を覗くと、たくさんのアイデアにあふれていて、
                来場者も自分なりに研究との接点を見つけられる空間が広がっている。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 学生の成果セクションは背景色を白に揃えて落ち着いた印象にします。 */}
      {/* モバイルの下余白のみ増やして、セクション終端の詰まり感を解消します。 */}
      <section
        data-reveal
        className="relative bg-[#F9F9F9] px-4 pb-20 pt-12 md:px-8 lg:px-[128px] md:py-[96px]"
      >
        {/* 背景装飾はFigma指定のtop-decoration3/4を使用します。 */}
        <div className="pointer-events-none absolute right-0 top-0 hidden md:block">
          <img
            src={worksDecorationPrimaryUrl}
            alt=""
            className="h-[565px] w-[389px]"
          />
        </div>
        <div className="pointer-events-none absolute left-0 top-[320px] hidden md:block">
          <img
            src={worksDecorationSecondaryUrl}
            alt=""
            className="h-[260px] w-[550px]"
          />
        </div>
        {/* モバイル装飾はtop-decoration4に統一します。 */}
        <div className="pointer-events-none absolute right-0 top-[120px] md:hidden">
          <img
            src={worksDecorationSecondaryUrl}
            alt=""
            className="h-[260px] w-[260px]"
          />
        </div>

        <div className="relative mx-auto md:max-w-[1024px]">
          <div className="border-b border-[#FB9678] pb-1 md:flex md:justify-center">
            <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.04em]">
              研究・作品紹介
            </p>
          </div>
          {/* タイトル下の本文はBodyLに合わせ、サイズと行間を一段上げます。 */}
          <p className="mt-4 text-[15px] leading-[2.2] text-[#4B5459] md:text-center md:text-[16px] md:leading-[2.2] md:tracking-[0.04em]">
            研究や作品をコース・研究室ごとに閲覧できます。
          </p>
          {/* モバイルは左右にカードを見せつつ、右から左に流れるフェードで切り替えます。 */}
          <div className="mt-6 md:hidden">
            {mobilePreviewItem ? (
              <div className="top-page-mobile-slide-frame relative overflow-hidden">
                <div className="flex items-start justify-center gap-3">
                  {hasSidePreviews ? (
                    <Link
                      key={`prev-${mobilePreviewKey}`}
                      href={mobilePrevItem.href}
                      className={`z-0 flex w-[200px] shrink-0 flex-col gap-2 opacity-40 ${
                        hasMultiplePreviews
                          ? "animate-[top-page-side-fade_6000ms_ease]"
                          : ""
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden rounded-[4px]">
                        <img
                          src={mobilePrevItem.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] leading-[1.5] text-[#6A7378]">
                        {mobilePrevItem.title}
                      </p>
                    </Link>
                  ) : null}

                  <Link
                    key={mobilePreviewKey}
                    href={mobilePreviewItem.href}
                    className={`z-10 flex w-[236px] shrink-0 flex-col gap-2 text-center ${
                      hasMultiplePreviews
                        ? "animate-[top-page-slide-fade_6000ms_ease]"
                        : ""
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden rounded-[4px]">
                      <img
                        src={mobilePreviewItem.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-left text-[12px] font-medium leading-[1.5] text-[#4B5459]">
                      {mobilePreviewItem.title}
                    </p>
                    <p className="text-left text-[12px] text-[#6A7378]">
                      {mobilePreviewItem.author}
                    </p>
                  </Link>

                  {hasSidePreviews ? (
                    <Link
                      key={`next-${mobilePreviewKey}`}
                      href={mobileNextItem.href}
                      className={`z-0 flex w-[200px] shrink-0 flex-col gap-2 text-center opacity-40 ${
                        hasMultiplePreviews
                          ? "animate-[top-page-side-fade_6000ms_ease]"
                          : ""
                      }`}
                    >
                      <div className="aspect-video w-full overflow-hidden rounded-[4px]">
                        <img
                          src={mobileNextItem.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] leading-[1.5] text-[#6A7378]">
                        {mobileNextItem.title}
                      </p>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-8 hidden grid-cols-3 gap-8 md:grid">
            {/* 研究/作品ページへの導線を統合し、カード全体をクリックできるようにします。 */}
            {visiblePreviewItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col gap-2 text-left"
              >
                <div className="aspect-video w-full overflow-hidden rounded-[4px]">
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-left text-[12px] font-medium leading-[1.5] text-[#4B5459]">
                  {item.title}
                </p>
                <p className="text-[12px] text-[#6A7378]">{item.author}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/research"
              className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.15)] md:px-[56px] md:py-[20px]"
            >
              学生の成果を見る
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <style jsx global>{`
          /* モバイルのスライド枠は高さを固定して、フェード中のレイアウト揺れを防ぎます。 */
          .top-page-mobile-slide-frame {
            min-height: 220px;
          }
          /* モバイルのメインカードは中央で止め、ゆっくり左に流れていく違和感を避けます。 */
          @keyframes top-page-slide-fade {
            0% {
              opacity: 0;
              transform: translateX(18px);
            }
            20% {
              opacity: 1;
              transform: translateX(0);
            }
            80% {
              opacity: 1;
              transform: translateX(0);
            }
            100% {
              opacity: 0;
              transform: translateX(0);
            }
          }
          /* 左右カードも同じタイミングでフェードさせ、中央と揃えます。 */
          @keyframes top-page-side-fade {
            0% {
              opacity: 0;
            }
            20% {
              opacity: 0.4;
            }
            80% {
              opacity: 0.4;
            }
            100% {
              opacity: 0;
            }
          }
        `}</style>
      </section>

      {/* イベント紹介は上下余白を設け、指定画像を背景に使い雰囲気を合わせます。 */}
      {/* イベント背景はFigmaの淡いグレーをベースにし、背景画像で質感を足します。 */}
      <section
        data-reveal
        className="bg-[#EBEEF0] px-4 py-12 md:px-8 lg:px-[128px] md:py-[96px]"
        style={{
          backgroundImage: "url('/image/event_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto md:max-w-[1024px]">
          <div className="border-b border-[#FB9678] pb-1 md:flex md:justify-center">
            <p className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.04em]">
              土日限定のイベント
            </p>
          </div>
          {/* タイトル下の本文はBodyLに合わせ、サイズと行間を一段上げます。 */}
          <p className="mt-4 text-[15px] leading-[2.2] text-[#4B5459] md:text-center md:text-[16px] md:leading-[2.2] md:tracking-[0.04em]">
            卒業生と直接コミュニケーションをとることができる座談会や、体験展示イベントを予定しています。
          </p>
          {/* イベント詳細が準備中のため、トップページの画像枠も「Coming Soon」に統一します。 */}
          <div className="mt-6 flex flex-col gap-4 md:hidden">
            <div className="flex h-[240px] items-center justify-center rounded-[4px] bg-[#D9D9D9]">
              <p className="text-[14px] font-semibold tracking-[0.06em] text-[#6A7378]">
                Coming Soon...
              </p>
            </div>
            <div className="flex h-[240px] items-center justify-center rounded-[4px] bg-[#D9D9D9]">
              <p className="text-[14px] font-semibold tracking-[0.06em] text-[#6A7378]">
                Coming Soon...
              </p>
            </div>
          </div>
          <div className="mt-6 hidden gap-6 md:grid md:grid-cols-2">
            <div className="flex h-[364px] items-center justify-center rounded-[4px] bg-[#D9D9D9]">
              <p className="text-[14px] font-semibold tracking-[0.06em] text-[#6A7378]">
                Coming Soon...
              </p>
            </div>
            <div className="flex h-[364px] items-center justify-center rounded-[4px] bg-[#D9D9D9]">
              <p className="text-[14px] font-semibold tracking-[0.06em] text-[#6A7378]">
                Coming Soon...
              </p>
            </div>
          </div>
          {/* モバイルはボタン下の余白を少し足します。 */}
          <div className="mt-6 flex justify-center pb-4 md:pb-0">
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.15)] md:px-[56px] md:py-[20px]"
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
        className="relative bg-[#F9F9F9] px-4 py-12 md:px-8 lg:px-[128px] md:py-[96px]"
      >
        {/* 背景装飾は指定のdotgrid.svgを使用します。 */}
        <div className="pointer-events-none absolute right-6 top-6 hidden md:block md:right-[128px] md:top-[48px]">
          <img
            src="/image/dotgrid.svg"
            alt=""
            className="h-[144px] w-[192px]"
          />
        </div>
        {/* PC表示のみ、薄い円の装飾を追加してFigmaの雰囲気に寄せます。 */}
        <div className="pointer-events-none absolute left-70 top-110 hidden -translate-x-1/3 -translate-y-1/2 md:block">
          <img src="/image/circle.svg" alt="" className="h-[320px] w-[320px]" />
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
                <p className="mt-4 text-[15px] leading-[2.2] text-[#4B5459] md:text-[16px] md:leading-[2.2] md:tracking-[0.04em]">
                  卒業生のほとんどは本学大学院への進学、もしくは就職をしています。就職をする学生は、多くがデザイナーやエンジニアとして活躍予定です。
                </p>
              </div>
              {/* PCのみ、残り高さの中央にボタンを配置してFigmaのバランスに合わせます。 */}
              <div className="mt-6 hidden md:flex md:flex-1 md:items-center md:justify-center">
                <Link
                  href="/career"
                  className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.15)]"
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
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href="/career"
              className="flex items-center gap-2 rounded-full bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] shadow-[0_0_8px_rgba(106,115,120,0.15)]"
            >
              進路をもっと詳しく
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 開催場所はFigmaのレイアウトに合わせ、モバイルは地図を表示しません。 */}
      <section
        data-reveal
        className="bg-[#EBEEF0] px-4 py-12 md:px-8 lg:px-[128px] md:py-[96px]"
      >
        <div className="mx-auto flex flex-col gap-4 md:max-w-[1024px]">
          {/* 見出しは白背景+下線の構成に揃え、サイズはFigmaの20pxで固定します。 */}
          <div className="w-full border-b-2 border-[#FB9678] py-1">
            {/* デスクトップのみ、開催場所の見出しテキストを中央揃えにします。 */}
            <p className="text-[20px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-center">
              開催場所
            </p>
          </div>

          {/* 開催まとめはモバイルで縦並び、デスクトップで2カラムにします。 */}
          <div className="flex flex-col gap-3 md:flex-row md:gap-6">
            <div className="rounded-lg bg-[#F9F9F9] p-3 text-left md:flex-1 md:items-center md:text-center">
              <p className="text-[16px] font-medium leading-[1.5] text-[#D3793D] md:text-center">
                平日
              </p>
              <p className="mt-1 text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-center">
                有元史郎記念校友会館交流プラザにて研究の展示をします。展示されている研究の一覧は
                <Link href="/research" className="text-[#D3793D] underline">
                  こちら
                </Link>
                から。
              </p>
            </div>
            <div className="rounded-lg bg-[#F9F9F9] p-3 text-left md:flex-1 md:items-center md:text-center">
              <p className="text-[16px] font-medium leading-[1.5] text-[#D3793D] md:text-center">
                土日
              </p>
              <p className="mt-1 text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-center">
                平日の研究展示に加え、本部棟5階オープンラボにて体験展示を開催します。体験展示の詳細は
                <Link href="/events" className="text-[#D3793D] underline">
                  こちら
                </Link>
                から
              </p>
            </div>
          </div>

          {/* SIT MAPはデスクトップのみ表示し、カード内の罫線は均等に配置します。 */}
          <div className="hidden rounded-2xl bg-[#F9F9F9] px-4 py-6 md:block">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-[#DDE1E4]" />
              <p className="text-[16px] font-medium tracking-[0.15em] text-[#D3793D] [font-family:var(--font-roboto)]">
                SIT MAP
              </p>
              <span className="h-px flex-1 bg-[#DDE1E4]" />
            </div>
            <p className="mt-2 text-center text-[15px] leading-[2.2] tracking-[0.04em] text-[#4B5459]">
              開催場所の大学内の位置はこのようになっています。
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl">
              <img
                src={sitMapImageUrl}
                alt="豊洲キャンパス構内の配置図"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* アクセス情報は地図と動画導線を同じカードにまとめます。 */}
      <section
        data-reveal
        className="px-4 pt-12 md:px-8 lg:px-[128px] md:py-[96px]"
      >
        <div className="mx-auto md:max-w-[1024px]">
          {/* デスクトップは「卒業生の進路」と同様に、見出し線を中間幅で止めて右に地図を配置します。 */}
          <div className="mt-4 flex flex-col gap-6 md:mt-0 md:grid md:grid-cols-[480px_480px] md:items-start md:gap-[64px]">
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
            <div className="overflow-hidden md:mt-0">
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
          {/* ガイド動画導線は2段目で中央配置に整えます。 */}
          <div className="mt-6 md:mt-8">
            <div className="mx-auto max-w-[768px]">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-[#DDE1E4]" />
                <p className="text-[12px] font-medium tracking-[0.15em] text-[#D3793D] [font-family:var(--font-roboto)] md:text-[16px] md:tracking-[0.2em]">
                  GUIDE VIDEOS
                </p>
                <span className="h-px flex-1 bg-[#DDE1E4]" />
              </div>
              <p className="mt-2 text-center text-[15px] leading-[2.2] tracking-[0.04em] text-[#4B5459] md:text-[18px]">
                大学への行き方動画はこちらから
                <br />
                (Youtubeに遷移します。)
              </p>
              <div className="mt-4 flex items-center gap-4 md:justify-center md:gap-[64px]">
                <button
                  type="button"
                  onClick={handleGuideVideoClick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#FB9678] bg-[#F9F9F9] px-6 py-4 text-[13px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.15)] md:max-w-[352px] md:px-[56px] md:py-[24px] md:text-[15px]"
                >
                  豊洲駅から
                  {/* Figma指定のリンクアイコンをボタン内に配置します。 */}
                  <img src="/icon/link.svg" alt="" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleGuideVideoClick}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#FB9678] bg-[#F9F9F9] px-6 py-4 text-[13px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.15)] md:max-w-[352px] md:px-[56px] md:py-[24px] md:text-[15px]"
                >
                  越中島駅から
                  {/* Figma指定のリンクアイコンをボタン内に配置します。 */}
                  <img src="/icon/link.svg" alt="" className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フッターは既存コンポーネントを使用し、SNS導線をまとめます。 */}
      <div className="px-4 pt-12 md:px-0 md:pt-[48px]">
        <div className="mx-auto w-full md:max-w-[1280px]">
          <Footer className="w-full" />
        </div>
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
              // 作品ページの「閉じる」ボタン表現（淡いグレーの丸ピル＋マイナス）に揃えてUIの一貫性を保ちます。
              className="mt-6 inline-flex min-w-[140px] items-center justify-center gap-2 rounded-full border border-[#A3ADB2] bg-[#F9F9F9] px-8 py-3 text-[14px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.15)] md:text-[15px]"
            >
              閉じる
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 12H18"
                  stroke="#4B5459"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
