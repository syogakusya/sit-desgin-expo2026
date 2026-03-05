#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// このスクリプトは Node.js 単体実行の CommonJS で運用しているため、require を維持する。
// 既存のR2アップロード系スクリプトと同じ実行方式に揃え、運用手順の差分を最小化する。
// public 配下の静的アセットをR2へ一括アップロードする。

const fs = require("fs")
const path = require("path")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") })

const ROOT = path.resolve(__dirname, "..")
const PUBLIC_DIR = path.join(ROOT, "public")

// 変更理由: VercelのData Transferを減らす対象に絞って同期し、不要なアップロードを防ぐため。
const DEFAULT_TARGET_DIRS = ["key-visual", "image", "icon", "texture", "fonts"]

const REQUIRED_ENV = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT",
]

const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`)
  process.exit(1)
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_ENDPOINT = process.env.R2_ENDPOINT

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const contentTypeFor = (filename) => {
  const ext = path.extname(filename).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg"
  if (ext === ".webp") return "image/webp"
  if (ext === ".gif") return "image/gif"
  if (ext === ".svg") return "image/svg+xml"
  if (ext === ".ico") return "image/x-icon"
  if (ext === ".woff") return "font/woff"
  if (ext === ".woff2") return "font/woff2"
  if (ext === ".ttf") return "font/ttf"
  if (ext === ".otf") return "font/otf"
  if (ext === ".txt") return "text/plain; charset=utf-8"
  if (ext === ".xml") return "application/xml"
  if (ext === ".json") return "application/json"
  return "application/octet-stream"
}

const cacheControlFor = (objectKey) => {
  // 変更理由: フォントは差し替え時にファイル名更新を前提に長期キャッシュし、
  // それ以外の画像群は更新反映とのバランスを取るため1週間+SWRを採用する。
  if (objectKey.startsWith("fonts/")) {
    return "public, max-age=31536000, immutable"
  }
  return "public, max-age=604800, stale-while-revalidate=2592000"
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const dirArg = args.find((arg) => arg.startsWith("--dirs="))
  const dirs = dirArg
    ? dirArg
        .replace("--dirs=", "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_TARGET_DIRS
  return { dryRun, dirs }
}

const walkFiles = (targetDir) => {
  const files = []

  const traverse = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        traverse(fullPath)
        continue
      }
      if (entry.isFile()) {
        files.push(fullPath)
      }
    }
  }

  traverse(targetDir)
  return files
}

const toPosixPath = (value) => value.split(path.sep).join("/")

const pLimit = (maxConcurrency) => {
  let activeCount = 0
  const queue = []

  const next = () => {
    activeCount -= 1
    if (queue.length > 0) {
      const run = queue.shift()
      run()
    }
  }

  const runTask = async (fn, resolve, reject) => {
    activeCount += 1
    try {
      const result = await fn()
      resolve(result)
    } catch (error) {
      reject(error)
    } finally {
      next()
    }
  }

  return (fn) =>
    new Promise((resolve, reject) => {
      if (activeCount < maxConcurrency) {
        runTask(fn, resolve, reject)
        return
      }
      queue.push(() => runTask(fn, resolve, reject))
    })
}

const uploadOne = async (key, body, contentType, cacheControl, dryRun) => {
  if (dryRun) {
    return
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  )
}

const main = async () => {
  const { dryRun, dirs } = parseArgs()

  const tasks = []
  for (const dir of dirs) {
    const absDir = path.join(PUBLIC_DIR, dir)
    if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
      console.warn(`Skip missing directory: public/${dir}`)
      continue
    }

    const files = walkFiles(absDir)
    for (const filePath of files) {
      const key = toPosixPath(path.relative(PUBLIC_DIR, filePath))
      tasks.push({
        filePath,
        key,
        contentType: contentTypeFor(filePath),
        cacheControl: cacheControlFor(key),
      })
    }
  }

  if (tasks.length === 0) {
    console.log("No files to upload.")
    return
  }

  console.log(`Target files: ${tasks.length}`)
  console.log(`Mode: ${dryRun ? "dry-run" : "upload"}`)
  console.log(`Bucket: ${BUCKET_NAME}`)
  console.log(`Endpoint: ${R2_ENDPOINT}`)

  const limit = pLimit(8)
  let uploaded = 0

  await Promise.all(
    tasks.map((task) =>
      limit(async () => {
        const body = fs.readFileSync(task.filePath)
        await uploadOne(
          task.key,
          body,
          task.contentType,
          task.cacheControl,
          dryRun,
        )
        uploaded += 1
        console.log(
          `[${uploaded}/${tasks.length}] ${task.key} (${task.contentType})`,
        )
      }),
    ),
  )

  console.log(`Completed: ${uploaded} files`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
