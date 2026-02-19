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

  return (
    <div className="relative flex flex-col items-center">
      {/* 固定サイズを維持しつつ、親が狭い場合はmax幅で縮むようにしてはみ出しを防ぎます。 */}
      <div className="relative h-[320px] w-[320px] max-h-full max-w-full md:h-[463px] md:w-[463px]">
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
            WebkitMaskImage: `conic-gradient(transparent 0 ${jobEnd}%, #000 ${jobEnd}% 100%)`,
            maskImage: `conic-gradient(transparent 0 ${jobEnd}%, #000 ${jobEnd}% 100%)`,
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

        {/* ラベルは相対配置で位置を固定し、文字スタイルは指定に合わせます。 */}
        <p className="absolute left-[74%] top-[30%] -translate-x-1/2 -translate-y-1/2 font-bold leading-[1.5] text-[#F9F9F9] [font-family:var(--font-shippori-mincho-b1),'ShipporiMincho-OTF-Bold','Hiragino_Mincho_ProN',serif]">
          <span className="text-[18px] md:text-[28px]">本学大学院へ進学</span>
          <br />
          <span className="text-[18px] md:text-[28px]">
            {gradPercent.toFixed(1)}
          </span>
          <span className="text-[13px] md:text-[18px]">%</span>
        </p>
        <p className="absolute left-[30%] top-[58%] -translate-x-1/2 -translate-y-1/2 font-bold leading-[1.5] text-[#F9F9F9] [font-family:var(--font-shippori-mincho-b1),'ShipporiMincho-OTF-Bold','Hiragino_Mincho_ProN',serif]">
          <span className="text-[18px] md:text-[28px]">就職</span>{" "}
          <span className="text-[18px] md:text-[28px]">
            {jobPercent.toFixed(1)}
          </span>
          <span className="text-[13px] md:text-[18px]">%</span>
        </p>
        {/* 「その他」は比率が小さいためラベルを省略します。 */}
      </div>
      {/* nは円グラフの右下に配置します。 */}
      <p className="mt-2 w-full text-right text-[12px] text-[#4B5459] md:absolute md:bottom-0 md:right-0 md:mt-0 md:text-[20px]">
        合計{total}名
      </p>
    </div>
  )
}
