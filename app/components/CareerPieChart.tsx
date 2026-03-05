"use client"

type CareerPieChartProps = {
  gradPercent: number
  jobPercent: number
  otherPercent: number
  total: number
}

export default function CareerPieChart({
  gradPercent,
  jobPercent,
  otherPercent,
  total,
}: CareerPieChartProps) {
  const gradEnd = gradPercent
  const jobEnd = gradPercent + jobPercent
  // 変更理由: 集計丸め誤差で合計が100%を超える場合に備え、その他セグメントの終端を明示します。
  const otherEnd = Math.min(100, jobEnd + otherPercent)

  return (
    // 変更理由: Figma実寸に合わせ、モバイル361x348 / PC480x463 の比率で共通表示します。
    <div className="relative h-[348px] w-[361px] max-w-full md:h-[463px] md:w-[480px]">
      {/* 円グラフ本体はラッパー幅に対して96.4%で固定し、Figmaの余白バランスを維持します。 */}
      <div className="absolute left-1/2 top-0 aspect-square w-[96.4%] -translate-x-1/2">
        {/* 円グラフは3レイヤーで分割し、指定のグラデーションと単色で塗り分けます。 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              "linear-gradient(227deg, #57B250 16.02%, #66C88B 76.31%)",
            WebkitMaskImage: `conic-gradient(#000 0 ${gradEnd}%, transparent ${gradEnd}% 100%)`,
            maskImage: `conic-gradient(#000 0 ${gradEnd}%, transparent ${gradEnd}% 100%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            // 就職セグメントも同様にグラデーションを適用します。
            backgroundImage:
              "linear-gradient(135deg, #FB9678 0%, #ECC08F 100%)",
            WebkitMaskImage: `conic-gradient(transparent 0 ${gradEnd}%, #000 ${gradEnd}% ${jobEnd}%, transparent ${jobEnd}% 100%)`,
            maskImage: `conic-gradient(transparent 0 ${gradEnd}%, #000 ${gradEnd}% ${jobEnd}%, transparent ${jobEnd}% 100%)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "#6A7378",
            WebkitMaskImage: `conic-gradient(transparent 0 ${jobEnd}%, #000 ${jobEnd}% ${otherEnd}%, transparent ${otherEnd}% 100%)`,
            maskImage: `conic-gradient(transparent 0 ${jobEnd}%, #000 ${jobEnd}% ${otherEnd}%, transparent ${otherEnd}% 100%)`,
          }}
        />

        {/* フッターと同じ手法でノイズを重ね、質感を揃えます。 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full opacity-[0.8] mix-blend-soft-light"
          style={{
            backgroundImage: "url('/texture/texture_noise.png')",
            backgroundSize: "120px 120px",
            backgroundPosition: "top left",
            backgroundRepeat: "repeat",
          }}
        />

        {/* 変更理由: ユーザー要望に合わせ、扇形内ラベルはカテゴリ名のみを表示します。 */}
        <p className="absolute left-[72.5%] top-[31%] -translate-x-1/2 -translate-y-1/2 text-center font-bold leading-[1.5] text-[#F9F9F9] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
          {/* 変更理由: 文言を必ず2行で固定表示するため、改行位置を固定し各行を折り返し禁止にします。 */}
          <span className="whitespace-nowrap text-[24px] md:text-[32px]">本学大学院</span>
          <br />
          <span className="whitespace-nowrap text-[24px] md:text-[32px]">へ進学</span>
        </p>
        <p className="absolute left-[37%] top-[65%] -translate-x-1/2 -translate-y-1/2 text-center font-bold leading-[1.5] text-[#F9F9F9] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
          <span className="text-[24px] md:text-[32px]">就職</span>
        </p>
        {/* 「その他」は比率が小さいためラベルを省略します。 */}
      </div>

      {/* 変更理由: Figmaに合わせて集計表記を「合計◯◯名」に統一し、右下位置を固定します。 */}
      {/* 変更理由: 削除済みローカルフォント名へのフォールバック参照を外し、実際の配信フォント構成とCSS定義を一致させます。 */}
      <p className="absolute bottom-0 right-0 text-right text-[12px] leading-[1.5] font-semibold text-[#737373] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[16px]">
        合計{total}名
      </p>
    </div>
  )
}
