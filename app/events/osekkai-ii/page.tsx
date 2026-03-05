import type { Metadata } from "next"

import { buildPageMetadata } from "@/lib/site-metadata"

import OsekkaiClient from "./OsekkaiClient"

export const metadata: Metadata = buildPageMetadata({
  title: "【デザ工1,2年生向け】デザイン工学部なんでも相談会-OSEKKAⅡ-",
  description:
    // 変更理由: OSEKKAⅡ本文の冒頭表現を見直したため、検索結果やSNSプレビューで見える説明文も同じ言い回しに揃えます。
    "豊洲キャンパスに通うデザイン工学部の先輩達が、皆さんのお悩みにお答えする相談会 OSEKKAⅡ の開催日程・会場・参加情報を掲載しています。",
  path: "/events/osekkai-ii",
  // 変更理由: OSEKKAII詳細ページのURL共有時にも、OSEKKAIページと同様に
  // SNSプレビュー画像を安定表示させるため、1200x630の専用OGP画像を明示指定します。
  // WebP(16:9)のままだとクローラ側でトリミングや取得失敗が起きるケースがあるため、
  // OGP推奨比率へ合わせたPNGを利用して表示互換性を高めます。
  imageUrl: "/image/osekkai2-ogp.png?v=20260303a",
})

export default function OsekkaiPage() {
  return <OsekkaiClient />
}
