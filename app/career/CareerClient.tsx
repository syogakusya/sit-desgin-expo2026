"use client"

import { useMemo, useEffect, useState } from "react"

import CareerPieChart from "../components/CareerPieChart"
import Footer from "../components/Footer"
import GlobalHeader from "../components/GlobalHeader"
import useSectionReveal from "../components/useSectionReveal"

type JobCategory = {
  title: string
  percentage: number
  items: string[]
}

type ReasonCard = {
  text: string
  labels?: string[]
}

type GradReasonCard = {
  text: string
  course: string
}

type Career = {
  id: string
  student_id: string
  category?: string | null
  category_type?: string | null
  detail?: string | null
  job_type?: string | null
  industry?: string | null
  decision_reason?: string | null
  extra_notes?: string | null
  visibility?: string | null
  student?: {
    student_no?: string | null
    lab?: {
      course?: string | null
    } | null
  } | null
}

type SkeletonBlockProps = {
  className?: string
}

const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => {
  // ローディング時のプレースホルダーを統一するための簡易スケルトンです。
  return (
    <div className={`relative overflow-hidden bg-[#f0f2f3] ${className}`}>
      <div className="absolute inset-0 skeleton-shimmer bg-linear-to-r from-transparent via-white/30 to-transparent" />
    </div>
  )
}

const normalizeText = (value?: string | null) => value?.trim() ?? ""

const buildJobLabel = (career: Career) => {
  // 主な就職先は「企業名（detail）」がある場合のみ表示します。
  const company = normalizeText(career.detail)
  return company || ""
}

const resolveJobCategory = (career: Career) => {
  // 主な就職先の分類は category_type を優先し、未入力の場合のみ「その他」にまとめます。
  const raw = normalizeText(career.category_type)
  return raw || "その他"
}

const toUniqueList = (items: string[], limit = 5) => {
  const seen = new Set<string>()
  const results: string[] = []
  items.forEach((item) => {
    if (!item || seen.has(item)) return
    seen.add(item)
    results.push(item)
  })
  return results.slice(0, limit)
}

const buildJobLabels = (career: Career) => {
  // ラベルは職種を基本表示し、未入力の場合のみ業種（またはカテゴリ分類）で代替します。
  const jobType = normalizeText(career.job_type)
  const industry =
    normalizeText(career.industry) || normalizeText(career.category_type)
  if (jobType) {
    return [jobType]
  }
  if (industry) {
    return [industry]
  }
  return []
}

const buildCourseLabel = (career: Career) => {
  // 進学理由のコース表示は研究室のコースを優先し、なければカテゴリ種別を使います。
  return (
    normalizeText(career.student?.lab?.course) ||
    normalizeText(career.category_type)
  )
}

export default function CareerClient() {
  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 主な就職先のフィルタ: 大学院生（cy20XXX）を含めるかどうかを切り替えます。
  const [includeGraduate, setIncludeGraduate] = useState(true)
  // 「もっと見る」制御: 就職先の決め手/大学院進学の理由で5件超えた場合に展開します。
  const [showAllJobReasons, setShowAllJobReasons] = useState(false)
  const [showAllGradReasons, setShowAllGradReasons] = useState(false)

  // 進路ページの各セクションにスライドインを適用します。
  useSectionReveal()

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // 非公開データを除外するため、公開指定付きでキャリアAPIを取得します。
        const res = await fetch("/api/careers?visibility=public&include=student")
        if (!res.ok) {
          throw new Error("Failed to fetch career data.")
        }
        const data = (await res.json()) as Career[]
        if (!active) return
        setCareers(data)
      } catch (fetchError) {
        if (!active) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch career data."
        setError(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const careerStats = useMemo(() => {
    // 非公開を除外したデータで進路別の割合を算出します。
    const total = careers.length
    let gradCount = 0
    let jobCount = 0
    let otherCount = 0

    careers.forEach((career) => {
      const category = normalizeText(career.category)
      if (category.includes("大学院")) {
        gradCount += 1
      } else if (category.includes("就職")) {
        jobCount += 1
      } else {
        otherCount += 1
      }
    })

    const toPercent = (count: number) =>
      total > 0 ? (count / total) * 100 : 0

    return {
      total,
      gradCount,
      jobCount,
      otherCount,
      gradPercent: toPercent(gradCount),
      jobPercent: toPercent(jobCount),
      otherPercent: toPercent(otherCount),
    }
  }, [careers])

  const jobCategories = useMemo((): JobCategory[] => {
    // 就職者のみを抽出し、カテゴリごとの割合と主要就職先をまとめます。
    const jobCareers = careers.filter((career) => {
      if (!normalizeText(career.category).includes("就職")) return false
      if (includeGraduate) return true
      // 学籍番号がcy20XXXの場合は大学院生扱いとして除外します。
      const studentNo = normalizeText(career.student?.student_no)
      return !studentNo.startsWith("cy20")
    })
    let total = 0
    const grouped = new Map<string, { count: number; items: string[] }>()

    jobCareers.forEach((career) => {
      const label = resolveJobCategory(career)
      const item = buildJobLabel(career)
      // 「その他」は企業名がある就職者のみを集計対象にし、未記入は割合から除外します。
      if (label === "その他" && !item) return
      total += 1
      if (!grouped.has(label)) {
        grouped.set(label, { count: 0, items: [] })
      }
      const group = grouped.get(label)
      if (!group) return
      group.count += 1
      if (item) {
        group.items.push(item)
      }
    })

    // 主な就職先は割合に関わらず、デザイン→エンジニア→その他の順で固定表示します。
    const order = ["デザイナー系", "エンジニア系", "その他"]
    const categories = Array.from(grouped.entries())
      .sort((a, b) => {
        const aIndex = order.indexOf(a[0])
        const bIndex = order.indexOf(b[0])
        if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
      .map(([title, group]) => ({
        title,
        percentage: total > 0 ? (group.count / total) * 100 : 0,
        items: toUniqueList(group.items, 12),
      }))

    return categories
  }, [careers, includeGraduate])

  const jobDecisionReasons = useMemo((): ReasonCard[] => {
    // 就職者の「決め手」は decision_reason から取得し、対応する職種・業界ラベルを付与します。
    const reasons = careers
      .filter((career) => normalizeText(career.category).includes("就職"))
      .map((career) => ({
        text: normalizeText(career.decision_reason),
        labels: buildJobLabels(career),
      }))
      .filter((reason) => reason.text)

    const seen = new Set<string>()
    const results: ReasonCard[] = []
    reasons.forEach((reason) => {
      if (seen.has(reason.text)) return
      seen.add(reason.text)
      results.push({
        text: reason.text,
        labels: reason.labels.length > 0 ? reason.labels : undefined,
      })
    })

    return results
  }, [careers])

  const gradReasons = useMemo((): GradReasonCard[] => {
    // 大学院進学の理由は extra_notes を優先し、なければ decision_reason を補助に使います。
    const reasons = careers
      .filter((career) => normalizeText(career.category).includes("大学院"))
      .map((career) => ({
        text:
          normalizeText(career.extra_notes) ||
          normalizeText(career.decision_reason),
        course: buildCourseLabel(career),
      }))
      .filter((reason) => reason.text && reason.course)

    const seen = new Set<string>()
    const results: GradReasonCard[] = []
    reasons.forEach((reason) => {
      if (seen.has(reason.text)) return
      seen.add(reason.text)
      results.push({ text: reason.text, course: reason.course })
    })

    return results
  }, [careers])

  return (
    // 短いページでもフッター下に余白が出ないように、最小高さを設定します。
    // モバイルは画面幅いっぱいに広げるため、最大幅の制限はmd以上に限定します。
    <div className="mx-auto flex min-h-screen w-full flex-col bg-[#F9F9F9] text-[#2E3437] md:max-w-[1200px] lg:max-w-[1280px]">
      {/* デスクトップは横幅のみ広げ、シングルカラムの構成は維持します。 */}
      {/* 全ページ共通のヘッダーを配置し、スクロール中も固定表示します。 */}
      <GlobalHeader activeId="career" />
      {/* 固定ヘッダーと内容が重ならないよう、ページ全体の上余白を確保します。 */}
      <div className="pt-[84px] md:pt-[96px]">

      {/* Figmaのヘッダー構成に合わせ、左のグラデーションバーとメニューボタンを配置します。 */}
      <div className="flex items-center justify-between px-4 pt-6 md:px-[128px] md:pt-[36px]">
        <div className="flex items-center gap-3">
          <span className="h-6 w-2 rounded-[4px] bg-gradient-to-b from-[#FB9678] to-[#E5A967]" />
          <h1 className="text-[24px] font-extrabold tracking-[0.04em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[28px] md:tracking-[0.02em]">
            卒業生の進路
          </h1>
        </div>
        {/* メニューボタンは共通ヘッダー側で固定表示しています。 */}
      </div>

      {/* リード文はFigmaの行間と字間を再現して読みやすく整えます。 */}
      <div className="px-4 pt-6 md:px-[128px] md:pt-[24px]">
        <p className="text-[15px] leading-[2.2] tracking-[0.04em] text-[#4B5459] md:text-[18px] md:tracking-[0.04em]">
          卒業生のほとんどは本学大学院への進学、もしくは就職をしています。就職をする学生は、多くがデザイナーやエンジニアとして活躍予定です。
        </p>
        {error ? (
          <p className="mt-3 text-[13px] text-[#D04C4C]">
            進路データの取得に失敗しました。
          </p>
        ) : null}
      </div>

      {/* 進路別の割合セクションは円グラフと注釈をまとめて表示します。 */}
      <section
        data-reveal
        className="px-4 pb-12 pt-12 md:px-[128px] md:py-[96px]"
      >
        <div className="md:flex md:items-start md:gap-[64px]">
          <div className="md:w-[480px]">
            <div className="border-b border-[#FB9678] pb-1 md:pb-2">
              <h2 className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px] md:tracking-[0.02em]">
                進路別の割合
              </h2>
            </div>
            {/* デスクトップでは注釈を見出し直下に配置します。 */}
            <p className="mt-4 hidden text-[14px] leading-[1.6] tracking-[0.02em] text-[#6A7378] md:block">
              ※卒業・修了研究展に出展する学生の進路の割合です。デザイン工学部全体の進路の割合とは異なる可能性があります。
            </p>
          </div>
          <div className="mt-8 flex justify-center md:mt-0 md:w-[480px] md:justify-start">
            <div className="relative">
              {/* 円グラフ本体は既存コンポーネントを流用して統一します。 */}
              {loading ? (
                // 円グラフの実寸と同じサイズでスケルトンを出し、ロード直後の拡大ズレを防ぎます。
                <SkeletonBlock className="h-[320px] w-[320px] rounded-full md:h-[463px] md:w-[463px]" />
              ) : (
                <CareerPieChart
                  gradPercent={careerStats.gradPercent}
                  jobPercent={careerStats.jobPercent}
                  otherPercent={careerStats.otherPercent}
                  total={careerStats.total}
                />
              )}
            </div>
          </div>
          {/* モバイルではチャートの下に注釈を置きます。 */}
        </div>
        <p className="mt-4 text-[12px] leading-[1.6] tracking-[0.02em] text-[#6A7378] md:hidden">
          ※卒業・修了研究展に出展する学生の進路の割合です。デザイン工学部全体の進路の割合とは異なる可能性があります。
        </p>
      </section>

      {/* 就職先一覧はカテゴリごとにまとめ、Figmaのカード構成に合わせます。 */}
      <section
        data-reveal
        className="px-4 py-12 md:px-[128px] md:py-[96px]"
      >
        <div className="flex items-center justify-between border-b border-[#FB9678] pb-1">
          <h2 className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
            主な就職先
          </h2>
          {/* Figmaのチェックボックスに合わせ、アイコン+ラベルの余白とサイズを固定します。 */}
          <button
            type="button"
            className="flex items-center gap-[6px]"
            aria-pressed={includeGraduate}
            onClick={() => setIncludeGraduate((prev) => !prev)}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center">
              {includeGraduate ? (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-gradient-to-br from-[#FB9678] to-[#E5A967]">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-[18px] w-[18px]"
                    fill="none"
                  >
                    <path
                      d="M6 12.5L10 16.5L18 8.5"
                      stroke="#F9F9F9"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] bg-[#EBEEF0] p-[2px]">
                  <span className="h-full w-full rounded-[4px] bg-[#F9F9F9]" />
                </span>
              )}
            </span>
            <span className="text-[13px] font-medium leading-[1.5] text-[#2E3437] md:text-[15px]">
              大学院生を含める
            </span>
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-[16px] md:tracking-[0.02em]">
          就職する人の多くが、デザイナーもしくはエンジニアになっています。
        </p>

        {loading ? (
          <>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`job-skel-${index}`} className="mt-6">
                <SkeletonBlock className="h-6 w-48 rounded-md" />
                <SkeletonBlock className="mt-3 h-28 w-full rounded-[12px]" />
              </div>
            ))}
          </>
        ) : jobCategories.length > 0 ? (
          jobCategories.map((category) => (
            <div key={category.title} className="mt-6">
              {/* 見出し行は数値を強調し、Figmaのタイポグラフィを踏襲します。 */}
              <p className="text-[16px] font-medium text-[#2E3437] md:text-[20px]">
                <span className="leading-[1.5]">{category.title}　</span>
                <span className="text-[24px] font-bold text-[#D3793D] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
                  {category.percentage.toFixed(1)}
                </span>
                <span className="text-[16px] font-bold text-[#D3793D] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
                  %
                </span>
              </p>
              <div className="mt-2 rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[15px] leading-[2.2] tracking-[0.04em] text-[#4B5459] md:px-[20px] md:py-[20px] md:text-[18px] md:tracking-[0.04em]">
                <ul className="list-disc pl-6">
                  {category.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-[13px] leading-[1.9] tracking-[0.02em] text-[#4B5459] md:text-[16px]">
                  など
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="mt-6 text-[13px] leading-[1.9] text-[#6A7378]">
            公開対象の就職先データがまだありません。
          </p>
        )}
      </section>

      {/* 就職先の決め手はカード形式で複数項目を並べ、読みやすさを優先します。 */}
      <section
        data-reveal
        className="px-4 py-12 md:px-[128px] md:py-[96px]"
      >
        <div className="border-b border-[#FB9678] pb-1">
          <h2 className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
            就職先の決め手
          </h2>
        </div>
        <div className="mt-4 space-y-4 md:mt-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`job-reason-skel-${index}`}
                className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 md:px-[20px] md:py-[20px]"
              >
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-full rounded-md" />
                  <SkeletonBlock className="h-4 w-10/12 rounded-md" />
                </div>
                <div className="mt-3 flex justify-end gap-3">
                  <SkeletonBlock className="h-4 w-20 rounded-md" />
                  <SkeletonBlock className="h-4 w-16 rounded-md" />
                </div>
              </div>
            ))
          ) : jobDecisionReasons.length > 0 ? (
            <>
              {/* 表示件数を5件に制限し、ボタン操作で全件表示に切り替えます。 */}
              {jobDecisionReasons.slice(0, 5).map((reason) => (
              <div
                key={reason.text}
                className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
              >
                <p>{reason.text}</p>
                {reason.labels ? (
                  <div className="mt-2 flex justify-end gap-3 text-[13px] font-medium text-[#4B5459] md:text-[15px]">
                    {reason.labels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              ))}
              {/* 追加分は研究室の開閉と同じロールアニメーションで表示します。 */}
              {jobDecisionReasons.length > 5 ? (
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    showAllJobReasons
                      ? "grid-rows-[1fr] opacity-100 translate-y-0"
                      : "grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                  aria-hidden={!showAllJobReasons}
                >
                  <div className="min-h-0">
                    <div className="mt-4 space-y-4">
                      {jobDecisionReasons.slice(5).map((reason) => (
                        <div
                          key={reason.text}
                          className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
                        >
                          <p>{reason.text}</p>
                          {reason.labels ? (
                            <div className="mt-2 flex justify-end gap-3 text-[13px] font-medium text-[#4B5459] md:text-[15px]">
                              {reason.labels.map((label) => (
                                <span key={label}>{label}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div
              className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
            >
              公開対象の決め手データがまだありません。
            </div>
          )}
        </div>
        {!loading && jobDecisionReasons.length > 5 ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              // 卒業生の進路ページの「もっと見る」ボタン枠線を指定色に統一します。
              // 「閉じる」表示時はFigmaの共通ボタン（淡いグレー・丸ピル）に統一します。
              className={`inline-flex items-center gap-2 rounded-full shadow-[0_0_8px_rgba(106,115,120,0.15)] ${
                showAllJobReasons
                  ? "border border-[#A3ADB2] bg-[#F9F9F9] px-8 py-4 text-[13px] font-medium text-[#4B5459] md:px-8 md:py-4 md:text-[13px]"
                  : "border border-[#D3793D] bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] md:px-[56px] md:py-[24px] md:text-[15px]"
              }`}
              onClick={() => setShowAllJobReasons((prev) => !prev)}
            >
              {showAllJobReasons ? "閉じる" : "もっと見る"}
              {showAllJobReasons ? (
                // 「閉じる」時はマイナス表現で統一します。
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
              ) : (
                <span className="text-[16px] leading-none md:text-[24px]">
                  +
                </span>
              )}
            </button>
          </div>
        ) : null}
      </section>

      {/* 大学院進学の理由は別セクションとしてまとめ、同じカードUIを使い回します。 */}
      <section
        data-reveal
        className="px-4 py-12 md:px-[128px] md:py-[96px]"
      >
        <div className="border-b border-[#FB9678] pb-1">
          <h2 className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[24px]">
            本学大学院進学の理由
          </h2>
        </div>
        <div className="mt-4 space-y-4 md:mt-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`grad-reason-skel-${index}`}
                className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 md:px-[20px] md:py-[20px]"
              >
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-full rounded-md" />
                  <SkeletonBlock className="h-4 w-10/12 rounded-md" />
                </div>
                <div className="mt-3 flex justify-end">
                  <SkeletonBlock className="h-4 w-24 rounded-md" />
                </div>
              </div>
            ))
          ) : gradReasons.length > 0 ? (
            <>
              {/* 表示件数を5件に制限し、ボタン操作で全件表示に切り替えます。 */}
              {gradReasons.slice(0, 5).map((reason) => (
                <div
                  key={reason.text}
                  className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
                >
                  <p>{reason.text}</p>
                  <div className="mt-2 flex justify-end text-[13px] font-medium text-[#4B5459] md:text-[15px]">
                    <span>{reason.course}</span>
                  </div>
                </div>
              ))}
              {/* 追加分は研究室の開閉と同じロールアニメーションで表示します。 */}
              {gradReasons.length > 5 ? (
                <div
                  className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    showAllGradReasons
                      ? "grid-rows-[1fr] opacity-100 translate-y-0"
                      : "grid-rows-[0fr] opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                  aria-hidden={!showAllGradReasons}
                >
                  <div className="min-h-0">
                    <div className="mt-4 space-y-4">
                      {gradReasons.slice(5).map((reason) => (
                        <div
                          key={reason.text}
                          className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
                        >
                          <p>{reason.text}</p>
                          <div className="mt-2 flex justify-end text-[13px] font-medium text-[#4B5459] md:text-[15px]">
                            <span>{reason.course}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div
              className="rounded-[12px] border border-[#EBEEF0] bg-[#EBEEF0] px-3 py-3 text-[13px] leading-[1.9] tracking-[0.02em] text-[#2E3437] md:px-[20px] md:py-[20px] md:text-[16px]"
            >
              公開対象の進学理由データがまだありません。
            </div>
          )}
        </div>
        {!loading && gradReasons.length > 5 ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              // 卒業生の進路ページの「もっと見る」ボタン枠線を指定色に統一します。
              // 「閉じる」表示時はFigmaの共通ボタン（淡いグレー・丸ピル）に統一します。
              className={`inline-flex items-center gap-2 rounded-full shadow-[0_0_8px_rgba(106,115,120,0.15)] ${
                showAllGradReasons
                  ? "border border-[#A3ADB2] bg-[#F9F9F9] px-8 py-4 text-[13px] font-medium text-[#4B5459] md:px-8 md:py-4 md:text-[13px]"
                  : "border border-[#D3793D] bg-[#D3793D] px-8 py-4 text-[13px] font-medium text-[#F9F9F9] md:px-[56px] md:py-[24px] md:text-[15px]"
              }`}
              onClick={() => setShowAllGradReasons((prev) => !prev)}
            >
              {showAllGradReasons ? "閉じる" : "もっと見る"}
              {showAllGradReasons ? (
                // 「閉じる」時はマイナス表現で統一します。
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
              ) : (
                <span className="text-[16px] leading-none md:text-[24px]">
                  +
                </span>
              )}
            </button>
          </div>
        ) : null}
      </section>

      {/* フッターはトップページ・研究ページと同じ横幅(1280px)で中央揃えにします。 */}
      <div className="mt-16 px-4 md:mt-[48px] md:px-0">
        <div className="mx-auto w-full md:max-w-[1280px]">
          <Footer className="w-full" />
        </div>
      </div>
      </div>
    </div>
  )
}
