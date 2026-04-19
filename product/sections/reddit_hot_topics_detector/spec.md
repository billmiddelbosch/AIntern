# Reddit Hot Topics Detector -- Lambda Specification

## 1. Purpose

Detect emerging, high-signal topics from Reddit related to: - AI coding
workflows\
- Spec-driven development\
- AI opportunities for MKB (SMBs)

------------------------------------------------------------------------

## 2. System Overview

EventBridge (cron) → Lambda (collector) → Lambda (analyzer) → Storage
(S3/DynamoDB)

------------------------------------------------------------------------

## 3. Components

### 3.1 Lambda: reddit-collector

Fetch, normalize, and rank Reddit posts.

**Input**

``` json
{
  "subreddits": ["startups", "Entrepreneur", "smallbusiness", "SaaS"],
  "queries": ["ai coding", "ai automation", "spec driven development"],
  "limit": 50
}
```

**Logic** - Fetch from Reddit JSON endpoints\
- Normalize + deduplicate\
- Compute hot score\
- Filter low-signal posts\
- Return top N

------------------------------------------------------------------------

### 3.2 Lambda: topic-analyzer

Convert posts into structured topics using an LLM.

**Output**

``` json
{
  "topics": [
    {
      "name": "Topic title",
      "summary": "Explanation",
      "signals": ["..."],
      "why_now": "...",
      "mkb_opportunity": "...",
      "product_idea": "...",
      "scores": {
        "heat": 1,
        "mkb_relevance": 1,
        "build_opportunity": 1
      }
    }
  ]
}
```

------------------------------------------------------------------------

## 4. Storage

-   DynamoDB (recommended)\
-   or S3 (JSON snapshots)

------------------------------------------------------------------------

## 5. Orchestration

-   EventBridge trigger every 10 minutes\
-   Chain collector → analyzer → storage

------------------------------------------------------------------------

## 6. Non-Functional Requirements

-   Fast (\<10s per Lambda)\
-   Cached requests\
-   Retry logic\
-   Logging + observability

------------------------------------------------------------------------

## 7. Future Extensions

-   Trend tracking over time\
-   Multi-source ingestion\
-   Feedback loops

------------------------------------------------------------------------

## 8. PoC Learnings (2026-04-20)

A live end-to-end PoC confirmed the full pipeline works. Key findings:

**3.1 Collector**
- Reddit public JSON API requires only a `User-Agent` header — no auth needed
- Deduplication by post ID is sufficient; no URL normalisation needed
- Hot score formula `score + (comments × 3)` is an effective engagement proxy
- `min_score = 10` is a workable baseline; tune after first production run
- **Critical fix needed:** search queries return posts from off-topic subreddits — add an allowlist filter post-fetch to drop any post whose `subreddit` is not in the target list

**PoC pipeline stats** (3 subreddits + 3 queries, limit=25 each):
`150 raw → 150 deduped → 10 after filter`

**3.2 Analyzer**
- Claude Haiku (`claude-haiku-4-5-20251001`) reliably extracts structured topics from normalized post data — no need for a larger model
- Prompt must specify "return ONLY valid JSON, no markdown" to avoid code-fence wrapping in output
- Three topics extracted per run is the right granularity; more dilutes signal

------------------------------------------------------------------------

## Key Insight

This is a **signal extraction engine**, not just a scraper. Focus on
insights, not raw data.
