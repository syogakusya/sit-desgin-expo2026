import type { NextConfig } from "next";

const staticAssetRedirectPrefixes = [
  "key-visual",
  "image",
  "icon",
  "texture",
  "fonts",
] as const;

const normalizeAssetBaseUrl = (value?: string) => {
  if (!value) return "";
  return value.trim().replace(/\/+$/u, "");
};

const resolveAssetBaseUrl = () => {
  // 変更理由: 既存のR2運用は `R2_BUCKET_ENDPOINT` を中心に回っているため、
  // 静的アセット配信先も同じ値を優先して参照し、環境変数の管理先を統一します。
  // `NEXT_PUBLIC_ASSET_BASE_URL` は特殊ケース（CDNを分けたい等）向けの上書き値として残します。
  const normalized = normalizeAssetBaseUrl(
    process.env.R2_BUCKET_ENDPOINT || process.env.NEXT_PUBLIC_ASSET_BASE_URL,
  );
  // 変更理由: 設定ミスで不正URLを入れた場合にデプロイを壊さないよう、
  // http(s) 以外は未設定扱いにしてローカル配信へフォールバックします。
  if (!/^https?:\/\//u.test(normalized)) {
    return "";
  }
  return normalized;
};

const nextConfig: NextConfig = {
  // 変更理由: R2/CDN を使う場合、静的アセット要求をVercelから外部配信へ恒久リダイレクトし、
  // Vercel側のData Transferを最小化します。
  async redirects() {
    const assetBaseUrl = resolveAssetBaseUrl();
    if (!assetBaseUrl) {
      return [];
    }
    return staticAssetRedirectPrefixes.map((prefix) => ({
      source: `/${prefix}/:path*`,
      destination: `${assetBaseUrl}/${prefix}/:path*`,
      permanent: true,
    }));
  },
  // 変更理由: Vercel Data Transfer を抑えるため、配信頻度の高い静的アセットに
  // 明示的なHTTPキャッシュを付与し、再訪時の再ダウンロードを減らします。
  async headers() {
    return [
      {
        source: "/key-visual/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 変更理由: KVはトップ再訪時に同一アセット参照が多いため、ブラウザキャッシュを7日に延長します。
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 変更理由: 画像群も同様にキャッシュ期間を明示し、都度再取得を避けます。
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/icon/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 変更理由: 研究室ロゴなど同一アイコンの再読込を抑えるため、画像と同等のキャッシュを適用します。
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/texture/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 変更理由: 背景テクスチャは更新頻度が低いため長めに保持し、スクロール復帰時の転送を減らします。
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            // 変更理由: フォントは差し替え時にファイル名更新で運用する前提にし、長期キャッシュで転送を最小化します。
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
