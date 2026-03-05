"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import Footer from "../../components/Footer"
import GlobalHeader from "../../components/GlobalHeader"
import { SkeletonLoader } from "../../components/SkeletonLoader"
import useSectionReveal from "../../components/useSectionReveal"

type WorksDetailClientProps = {
  id: string
}

type Lab = {
  id: string
  name?: string | null
  official_name?: string | null
  course?: string | null
}

type Student = {
  id: string
  name?: string | null
  lab_id?: string | null
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
}

type StudentDetail = {
  id: string
  careers?: Career[] | null
}

type Portfolio = {
  id: string
  student_id: string
  title1?: string | null
  summary1?: string | null
  image1_url?: string | null
  image1_thumb_url?: string | null
  appeal_url_1?: string | null
  title2?: string | null
  summary2?: string | null
  image2_url?: string | null
  image2_thumb_url?: string | null
  appeal_url_2?: string | null
  overall_portfolio_url?: string | null
  student?: Student | null
}

type SkeletonBlockProps = {
  className?: string
}

type CourseMeta = {
  key: string
  buttonColor: string
}

const SkeletonBlock = ({ className = "" }: SkeletonBlockProps) => {
  // ローディング時のプレースホルダーを統一するための簡易スケルトンです。
  return (
    <div className={`relative overflow-hidden bg-[#f0f2f3] ${className}`}>
      <div className="absolute inset-0 skeleton-shimmer bg-linear-to-r from-transparent via-white/30 to-transparent" />
    </div>
  )
}

const courseOrder: CourseMeta[] = [
  { key: "社会情報コース", buttonColor: "#0A948A" },
  { key: "UXコース", buttonColor: "#2C68D3" },
  { key: "プロダクトコース", buttonColor: "#D1346F" },
  { key: "その他", buttonColor: "#6A7378" },
]

const getCourseKey = (course?: string | null) => {
  if (!course) return "その他"
  return course
}

const getCourseMeta = (courseKey: string) => {
  return courseOrder.find((course) => course.key === courseKey) ?? courseOrder[3]
}

const isAbsoluteUrl = (value?: string | null) => {
  return !!value && /^https?:\/\//i.test(value)
}

const normalizeText = (value?: string | null) => value?.trim() ?? ""

const pickOriginalImage = (original?: string | null, thumb?: string | null) => {
  // 詳細ページは元画像を優先し、相対パスしかない場合は絶対URLを選ぶ
  if (isAbsoluteUrl(original)) return original
  if (isAbsoluteUrl(thumb)) return thumb
  return original || thumb || null
}

const parseWorkId = (value?: string | null) => {
  // 余計な空白を除去してから解析する（未定義にも耐える）
  const normalized = (value ?? "").trim()
  const match = normalized.match(/^(.*)-(1|2)$/)
  if (!match) {
    return { portfolioId: normalized, index: 1 as const }
  }
  return {
    portfolioId: match[1].trim(),
    index: match[2] === "2" ? (2 as const) : (1 as const),
  }
}

type LabLogoPaths = {
  pc: string
  sp: string
}

const labLogoMap: Record<string, LabLogoPaths> = {
  // 研究室ロゴ（テキスト込み）は `public/icon/lab/pc` と `public/icon/lab/sp` に分離して管理します。
  // 研究室名の表記ゆれ（末尾の「研究室」有無）を吸収するため、キーは「研究室」を除いた名称で揃えます。
  "エモーショナルデザイン": {
    pc: "/icon/lab/pc/emotional-design.svg",
    sp: "/icon/lab/sp/emotional-design.svg",
  },
  "感性インタラクションデザイン": {
    pc: "/icon/lab/pc/kansei-interaction-design.svg",
    sp: "/icon/lab/sp/kansei-interaction-design.svg",
  },
  "ユーザーエクスペリエンスデザイン": {
    pc: "/icon/lab/pc/user-experience-design.svg",
    sp: "/icon/lab/sp/user-experience-design.svg",
  },
  "コンテクスチュアルデザイン": {
    pc: "/icon/lab/pc/contextual-design.svg",
    sp: "/icon/lab/sp/contextual-design.svg",
  },
  "コンピューティングデザイン": {
    pc: "/icon/lab/pc/computing-design.svg",
    sp: "/icon/lab/sp/computing-design.svg",
  },
  "メディア体験デザイン": {
    pc: "/icon/lab/pc/media-experience-design.svg",
    sp: "/icon/lab/sp/media-experience-design.svg",
  },
  "身体知デザイン": {
    pc: "/icon/lab/pc/embodied-knowledge-design.svg",
    sp: "/icon/lab/sp/embodied-knowledge-design.svg",
  },
  "プロダクト・エルゴノミクス・デザイン": {
    pc: "/icon/lab/pc/product-ergonomics-design.svg",
    sp: "/icon/lab/sp/product-ergonomics-design.svg",
  },
  "動態デザイン": {
    pc: "/icon/lab/pc/dynamic-design.svg",
    sp: "/icon/lab/sp/dynamic-design.svg",
  },
  "ヘルスケアデザイン": {
    pc: "/icon/lab/pc/healthcare-design.svg",
    sp: "/icon/lab/sp/healthcare-design.svg",
  },
  "感性価値デザイン": {
    pc: "/icon/lab/pc/kansei-value-design.svg",
    sp: "/icon/lab/sp/kansei-value-design.svg",
  },
  "インサイトデザイン": {
    pc: "/icon/lab/pc/insight-design.svg",
    sp: "/icon/lab/sp/insight-design.svg",
  },
  "デザインプロセス": {
    pc: "/icon/lab/pc/design-process.svg",
    sp: "/icon/lab/sp/design-process.svg",
  },
  "リサイクルデザイン": {
    pc: "/icon/lab/pc/recycle-design.svg",
    sp: "/icon/lab/sp/recycle-design.svg",
  },
  "認知デザイン": {
    pc: "/icon/lab/pc/cognitive-design.svg",
    sp: "/icon/lab/sp/cognitive-design.svg",
  },
  "デライトデザイン": {
    pc: "/icon/lab/pc/delight-design.svg",
    sp: "/icon/lab/sp/delight-design.svg",
  },
}

const normalizeLabKey = (value?: string | null) => {
  // 表示名の末尾に「研究室」が付く/付かない両方を同じキーとして扱えるように正規化します。
  return normalizeText(value).replace(/研究室$/u, "")
}

const resolveLabLogoPath = (lab?: Lab) => {
  if (!lab) return null
  const candidates = [lab.official_name, lab.name]
  for (const candidate of candidates) {
    const key = normalizeLabKey(candidate)
    if (!key) continue
    const paths = labLogoMap[key]
    if (paths) return paths
  }
  return null
}

export default function WorksDetailClient({ id }: WorksDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { portfolioId, index } = useMemo(() => parseWorkId(id), [id])
  const [labs, setLabs] = useState<Lab[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentCareers, setStudentCareers] = useState<Career[]>([])
  const [careerLoading, setCareerLoading] = useState(false)

  // 作品詳細ページの各セクションにスライドインを適用します。
  useSectionReveal()

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [labsRes, portfolioRes] = await Promise.all([
          fetch("/api/labs"),
          // 変更理由: 詳細ページで全作品JSONを毎回取得すると転送量が大きいため、
          // 作品ID単位のAPIへ切り替えて必要最小限のデータだけ取得します。
          fetch(`/api/portfolios/${encodeURIComponent(portfolioId)}`),
        ])

        if (!labsRes.ok || !portfolioRes.ok) {
          throw new Error("Failed to fetch detail data.")
        }

        const [labsData, portfolioData] = await Promise.all([
          labsRes.json(),
          portfolioRes.json(),
        ])

        if (!active) return

        setLabs(labsData)
        setPortfolio(portfolioData)
      } catch (fetchError) {
        if (!active) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch detail data."
        setError(message)
        // 変更理由: 取得失敗時に前回表示の作品情報が残ると誤表示になるため、
        // エラー時は詳細データを明示的に空に戻します。
        setPortfolio(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [portfolioId])

  const labById = useMemo(() => {
    return new Map(labs.map((lab) => [lab.id, lab]))
  }, [labs])

  // 作品詳細のボタン色は所属コースの色に合わせます。
  const studentLab = useMemo(
    () => labs.find((lab) => lab.id === portfolio?.student?.lab_id),
    [labs, portfolio?.student?.lab_id],
  )
  const courseMeta = useMemo(
    () => getCourseMeta(getCourseKey(studentLab?.course)),
    [studentLab?.course],
  )

  const student = portfolio?.student
  const lab = student?.lab_id ? labById.get(student.lab_id) : undefined
  // 研究室の下部表示は、表示名とロゴパスを先に解決して JSX 側を簡潔に保ちます。
  const labDisplayName = normalizeText(lab?.official_name ?? lab?.name)
  const labLogoPath = resolveLabLogoPath(lab)

  const workTitle = index === 2 ? portfolio?.title2 : portfolio?.title1
  // 作品概要は未入力のケースがあるため、空白のみを除去して表示有無を判定します。
  const workSummary = normalizeText(
    index === 2 ? portfolio?.summary2 : portfolio?.summary1,
  )
  const workImage = index === 2
    ? pickOriginalImage(portfolio?.image2_url, portfolio?.image2_thumb_url)
    : pickOriginalImage(portfolio?.image1_url, portfolio?.image1_thumb_url)
  // 作品の詳細リンクは作品ごとのURL（appeal_url_1 / appeal_url_2）を参照します。
  const workLink =
    index === 2 ? portfolio?.appeal_url_2 : portfolio?.appeal_url_1

  useEffect(() => {
    const studentId = portfolio?.student_id ?? student?.id
    if (!studentId) {
      // 学生情報が無い場合は進路情報も取得できないためリセットします。
      setStudentCareers([])
      return
    }

    let active = true

    const loadStudent = async () => {
      try {
        setCareerLoading(true)
        const res = await fetch(`/api/students/${studentId}`)
        if (!res.ok) {
          throw new Error("Failed to fetch student data.")
        }
        const data = (await res.json()) as StudentDetail
        if (!active) return
        setStudentCareers(data.careers ?? [])
      } catch {
        if (!active) return
        setStudentCareers([])
      } finally {
        if (active) setCareerLoading(false)
      }
    }

    loadStudent()

    return () => {
      active = false
    }
  }, [portfolio?.student_id, student?.id])

  const primaryCareer = studentCareers[0]
  const careerCompany = normalizeText(primaryCareer?.detail)
  const careerRole = normalizeText(primaryCareer?.job_type)
  const careerIndustry =
    normalizeText(primaryCareer?.industry) ||
    normalizeText(primaryCareer?.category_type)
  const careerDescription =
    normalizeText(primaryCareer?.decision_reason) ||
    normalizeText(primaryCareer?.extra_notes)
  const hasCareerContent =
    careerCompany || careerRole || careerIndustry || careerDescription

  const returnUrl = useMemo(() => {
    const params = new URLSearchParams()
    const returnTab = searchParams.get("returnTab")
    const focus = searchParams.get("focus")
    const lab = searchParams.get("lab")
    const course = searchParams.get("course")

    if (returnTab === "works") {
      params.set("tab", "works")
    }
    if (focus) params.set("focus", focus)
    if (lab) params.set("lab", lab)
    if (course) params.set("course", course)

    const suffix = params.toString()
    return suffix ? `/research?${suffix}` : "/research"
  }, [searchParams])

  return (
    // 変更理由: フッターを最大幅コンテナの外へ出して全幅表示にするため、
    // 全幅ラッパーと本文コンテナ（最大幅あり）を分離します。
    <div className="min-h-screen bg-white">
      {/* フッターが下端に張り付くよう、本文コンテナに最小高さを設定します。 */}
      {/* モバイルは画面幅いっぱいに広げるため、最大幅の制限はmd以上に限定します。 */}
      <div className="mx-auto flex min-h-screen w-full flex-col md:max-w-[1200px] lg:max-w-[1280px]">
      {/* デスクトップは横幅のみ広げ、シングルカラムの構成は維持します。 */}
      {/* 全ページ共通のヘッダーを配置し、スクロール中も固定表示します。 */}
      <GlobalHeader activeId="works" />
      {/* 固定ヘッダーと内容が重ならないよう、詳細ページ全体の上余白を確保します。 */}
      <div className="pt-[84px] md:pt-[96px]">

      {/* 見出しはスマホ/デスクトップとも不要のため削除します。 */}

      {/* メニューボタンは共通ヘッダー側で固定表示しています。 */}

      {/* 戻るボタンは作品一覧へ戻る導線として表示します。 */}
      <div className="px-4 md:px-[128px]">
        <button
          type="button"
          // 履歴がない場合に備えて一覧へフォールバックします。
          onClick={() => {
            if (searchParams.get("focus")) {
              router.push(returnUrl)
              return
            }
            if (window.history.length > 1) {
              router.back()
              return
            }
            router.push("/research?tab=works")
          }}
          className="flex h-20 items-center gap-2 text-[13px] font-medium text-[#6A7378]"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 6L9 12L15 18"
              stroke="#6A7378"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          戻る
        </button>
      </div>

      {error ? (
        <div className="px-4 pb-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            {error}
          </div>
        </div>
      ) : !portfolio && !loading ? (
        <div className="px-4 pb-12">
          <div className="rounded-2xl border border-[#EBEEF0] bg-white p-10 text-center text-sm text-[#6A7378]">
            対象の作品が見つかりませんでした。
          </div>
        </div>
      ) : (
        <>
          <section
            data-reveal
            className="px-4 pb-12 md:px-[128px] md:pb-[96px]"
          >
            <div className="flex flex-col gap-4 md:gap-5">
              <div className="space-y-1">
                {/* Figmaのタイトルタイポ（24px・字間0.02em）に合わせる */}
                {loading ? (
                  <>
                    <SkeletonBlock className="h-7 w-4/5 rounded-md" />
                    <div className="flex justify-end gap-2">
                      <SkeletonBlock className="h-4 w-24 rounded-md" />
                      <SkeletonBlock className="h-4 w-20 rounded-md" />
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-[24px] font-extrabold leading-[1.5] tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[28px] md:tracking-[0.02em]">
                      {workTitle ?? "作品タイトル"}
                    </h2>
                    {/* 研究室名 + 氏名の行はFigma準拠の13px/Medium */}
                    {/* 研究室名と氏名は詳細ページでも左寄せに揃えます。 */}
                    <div className="flex flex-wrap justify-start gap-2 text-[13px] font-medium leading-[1.5] md:text-[15px]">
                      <span className="text-[#6A7378]">
                        {lab?.official_name ?? lab?.name ?? "研究室名"}
                      </span>
                      <span className="text-[#4B5459]">
                        {student?.name ?? "苗字 名前"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* 本文は15px/行間2.2/字間0.04emに揃える */}
              {loading ? (
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-full rounded-md" />
                  <SkeletonBlock className="h-4 w-11/12 rounded-md" />
                  <SkeletonBlock className="h-4 w-10/12 rounded-md" />
                </div>
              ) : workSummary ? (
                <p className="text-[15px] leading-[2] tracking-[0.04em] text-[#4B5459] md:text-[18px] md:tracking-[0.04em]">
                  {workSummary}
                </p>
              ) : null}

              {/* 作品画像は画像の縦幅に合わせて表示します。 */}
              <div className="relative min-h-[160px] w-full overflow-hidden rounded-[4px] bg-[#EBEEF0]">
                {loading ? (
                  <SkeletonBlock className="absolute inset-0" />
                ) : workImage ? (
                  <SkeletonLoader
                    src={workImage}
                    alt=""
                    // 画像の縦幅に合わせて表示し、トリミングを避けます。
                    className="w-full"
                    imgClassName="h-auto w-full object-contain"
                    // 読み込み失敗時はプレースホルダーを表示します。
                    fallback={
                      <div className="absolute inset-0 grid place-items-center text-[12px] text-[#A3ADB2]">
                        No Image
                      </div>
                    }
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-[12px] text-[#A3ADB2]">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3 py-3 md:py-5">
                {loading ? (
                  <>
                    <SkeletonBlock className="h-12 w-44 rounded-full" />
                    <SkeletonBlock className="h-4 w-36 rounded-md" />
                  </>
                ) : workLink ? (
                  <a
                    href={workLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    // コース色ボタンはFigma仕様に合わせ、白グラデーション重ねで300msホバーを適用します。
                    className="flex items-center gap-2 rounded-full px-8 py-4 text-[13px] font-medium leading-[1.5] text-white shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background,box-shadow] duration-300 ease-in-out hover:[background:linear-gradient(108.58deg,rgba(255,255,255,0.20)_0.58%,rgba(255,255,255,0.15)_47.57%,rgba(255,255,255,0.10)_94.56%),var(--course-button-color)] hover:[background-blend-mode:plus-lighter] md:px-[56px] md:py-[24px]"
                    style={
                      {
                        backgroundColor: courseMeta.buttonColor,
                        "--course-button-color": courseMeta.buttonColor,
                      } as React.CSSProperties
                    }
                  >
                    この作品の詳細へ
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M7 17L17 7M9 7H17V15"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                ) : null}
                {/* 他の作品も見るリンクはポートフォリオ全体のURL（overall_portfolio_url）を参照します。 */}
                {!loading && portfolio?.overall_portfolio_url ? (
                  <a
                    href={portfolio.overall_portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-medium text-[#6A7378] underline"
                  >
                    その他の作品はこちらから
                  </a>
                ) : null}
              </div>
            </div>
          </section>

          {careerLoading || hasCareerContent ? (
            <section data-reveal className="px-4 md:px-[128px]">
              <div className="bg-white px-6 py-12 md:px-[24px] md:py-[96px]">
                {/* 進路見出し下線はコース色に合わせます。 */}
                <div
                  className="border-b pb-2"
                  style={{ borderColor: courseMeta.buttonColor }}
                >
                  <h3 className="text-[20px] font-extrabold tracking-[0.02em] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif]">
                    進路
                  </h3>
                </div>
                <div className="py-6">
                  {careerLoading ? (
                    <div className="space-y-3">
                      <SkeletonBlock className="h-5 w-3/4 rounded-md" />
                      <SkeletonBlock className="h-4 w-1/2 rounded-md" />
                      <SkeletonBlock className="h-4 w-full rounded-md" />
                    </div>
                  ) : (
                    <>
                      {(careerCompany || careerRole) && (
                        <div className="flex flex-wrap items-center gap-2 text-[18px] font-bold leading-[1.5] text-[#2E3437] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
                          {careerCompany ? <span>{careerCompany}</span> : null}
                          {careerRole ? (
                            // 企業名がない場合は役職のみを括弧なしで表示します。
                            <span>{careerCompany ? `(${careerRole})` : careerRole}</span>
                          ) : null}
                        </div>
                      )}
                      {careerIndustry ? (
                        <p className="mt-1 text-[13px] font-medium text-[#6A7378] md:text-[15px]">
                          {careerIndustry}
                        </p>
                      ) : null}
                      {careerDescription ? (
                        <p className="mt-4 text-[15px] leading-[2] tracking-[0.04em] text-[#4B5459] md:text-[18px] md:tracking-[0.04em]">
                          {careerDescription}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {loading || labDisplayName ? (
            <section data-reveal className="px-4 md:px-[128px]">
              {/* 下部の研究室表示は、テキスト込みロゴ画像に置き換えます。 */}
              {/* SP/PCで別画像を使うため、ブレークポイントで表示を切り替えます。 */}
              <div className="flex justify-center">
                {loading ? (
                  // Figma指定ノード（SP: 986:11973, PC: 986:11993）の実寸に合わせ、
                  // ロゴ画像表示前後のサイズ差でレイアウトが跳ねないようスケルトン寸法も揃えます。
                  <SkeletonBlock className="h-[103px] w-[129px] rounded-md md:h-[60px] md:w-[346px]" />
                ) : labLogoPath ? (
                  <>
                    <img
                      src={labLogoPath.sp}
                      alt={`${labDisplayName || "研究室"} ロゴ`}
                      // 画像自体が「ロゴ+研究室名テキスト」のため、テキスト込みの見た目高さをFigma基準に合わせます。
                      className="h-[103px] w-auto object-contain md:hidden"
                    />
                    <img
                      src={labLogoPath.pc}
                      alt={`${labDisplayName || "研究室"} ロゴ`}
                      // PCはFigmaノード高60pxに合わせ、現状の70px表示による縦方向の膨らみを解消します。
                      className="hidden h-[60px] w-auto object-contain md:block"
                    />
                  </>
                ) : labDisplayName ? (
                  // 画像未登録の研究室だけはテキストを表示し、表示欠落を防ぎます。
                  <p className="text-center text-[16px] font-bold leading-[1.5] text-[#4B5459] [font-family:var(--font-shippori-mincho-b1),'Hiragino_Mincho_ProN',serif] md:text-[20px]">
                    {labDisplayName}
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className="flex justify-center px-4 py-12 md:px-[16px] md:py-[96px]">
            <button
              type="button"
              // 一覧へ戻る導線も、直前のページへ戻れる場合は優先します。
              onClick={() => {
                if (searchParams.get("focus")) {
                  router.push(returnUrl)
                  return
                }
                if (window.history.length > 1) {
                  router.back()
                  return
                }
                router.push("/research?tab=works")
              }}
              // グレー枠のボタンはFigma仕様に合わせ、300msでグレー塗りへ遷移させます。
              className="group flex items-center gap-2 rounded-full border border-[#A3ADB2] bg-[#F9F9F9] px-8 py-4 text-[13px] font-medium text-[#4B5459] shadow-[0_0_8px_rgba(106,115,120,0.1)] transition-[background-color,color,border-color] duration-300 ease-in-out hover:bg-[#4B5459] hover:text-[#F9F9F9]"
            >
              一覧へ戻る
              {/* Figma指定のアイコンに差し替えます。 */}
              <img
                src="/icon/signal_cellular_alt.svg"
                alt=""
                className="h-3 w-3 transition-[filter] duration-300 ease-in-out group-hover:brightness-0 group-hover:invert"
              />
            </button>
          </div>
        </>
      )}

      </div>
      </div>
      {/* 変更理由: 本文のmax-width制限下に置くとフッター幅が狭くなるため、 */}
      {/* フッターはコンテナ外に移して常に画面幅いっぱいで描画します。 */}
      <Footer className="w-full" />
    </div>
  )
}
