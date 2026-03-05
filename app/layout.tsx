import type { Metadata } from "next"
import { Noto_Sans_JP, Roboto } from "next/font/google"
import localFont from "next/font/local"

import {
  siteDescription,
  siteTitle,
  siteUrl,
  socialPreviewImageUrl,
} from "@/lib/site-metadata"

import "./globals.css"

// 日本語本文はNoto Sans JPを標準にし、Figma指定の字形に近づけます。
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
})

// 英字ラベル（CONTACT/OFFICIAL SNSなど）はRobotoを使用します。
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-roboto",
  display: "swap",
})

// Shippori Mincho B1 OTF はローカルフォントとして読み込みます。
// 変更理由: Data Transfer 抑制のため、実表示で使われる太さ（400/700/800）に限定し、
// 未使用に近い中間ウェイト(500/600)の配信を止めます。
const shipporiMinchoB1 = localFont({
  src: [
    {
      path: "../public/fonts/ShipporiMinchoB1-OTF-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMinchoB1-OTF-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/ShipporiMinchoB1-OTF-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-shippori-mincho-b1",
  display: "swap",
})

export const metadata: Metadata = {
  // 変更理由: ページ別 metadata を追加した際にサイト名ルールを統一できるよう、
  // 既定タイトルとテンプレート（`{ページ名} | サイト名`）をlayout側で管理します。
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  // 実行環境に応じた公開URLを指定し、OG/Twitter の絶対URL解決に使います。
  metadataBase: new URL(siteUrl),
  // 変更理由: Search Console のHTMLメタタグ確認に対応するため、
  // Googleが指定する site verification トークンを全ページheadへ出力します。
  verification: {
    google: "38bezo3YKUbqrvz3JRP7MgObcY_OxeDkTmbiB73eG7U",
  },
  alternates: {
    // 変更理由: ルートページの canonical も絶対URLに揃え、クローラ間の解釈差分を防ぎます。
    canonical: siteUrl,
  },
  // public/icon/favicon.jpg から生成したファビコン/タッチアイコンを参照します。
  // favicon.ico は public 配下に置き、App Router の画像処理を避けます。
  icons: {
    // 検索結果のサイトアイコン取得で推奨される 48x48 を明示し、クロール時の解釈差分を減らします。
    shortcut: [{ url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" }],
    icon: [
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // SNS 共有時に各サービスが画像を認識しやすいよう、OGの基本項目を明示します。
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    // 共有対象ページの正規URLを絶対URLで明示し、クローラの解釈差分を減らす。
    url: siteUrl,
    type: "website",
    siteName: "SIT DESIGN EXPO 2026",
    locale: "ja_JP",
    images: [
      {
        url: socialPreviewImageUrl,
        width: 1200,
        height: 630,
        // 変更理由: OGP互換性を優先して既定画像をPNGに統一したため、MIMEタイプも一致させます。
        type: "image/png",
        alt: "芝浦工業大学デザイン工学部卒業展示2026 キービジュアル",
      },
    ],
  },
  // Twitter 共有時も同一のプレビュー画像を使い、カード形式を大型にします。
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: socialPreviewImageUrl,
        alt: "芝浦工業大学デザイン工学部卒業展示2026 キービジュアル",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${notoSansJP.variable} ${roboto.variable} ${shipporiMinchoB1.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
