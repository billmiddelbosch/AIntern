import axios from 'axios'

// Plain axios instance for S3 requests — no auth headers, no /api base URL
export const s3Client = axios.create({ timeout: 10_000 })
