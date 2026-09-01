/**
 * API Performance & Latency Benchmark Script
 * Usage: npx tsx scripts/benchmark-api.ts
 */

interface BenchmarkResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  avgLatencyMs: number;
  rps: number;
}

async function runBenchmark(
  name: string,
  url: string,
  totalRequests = 50,
  concurrency = 5
): Promise<BenchmarkResult> {
  console.log(
    "\n🚀 Starting benchmark: %s (%d requests, concurrency %d)...",
    name,
    totalRequests,
    concurrency
  );
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const startTime = Date.now();
  const queue = Array.from({ length: totalRequests }, (_, i) => i);

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      queue.pop();
      const reqStart = Date.now();
      try {
        const res = await fetch(url, { method: "GET" });
        const reqDuration = Date.now() - reqStart;
        latencies.push(reqDuration);
        if (res.status < 500) {
          successful++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
  });

  await Promise.all(workers);
  const totalDuration = Date.now() - startTime;

  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const rps = totalRequests / (totalDuration / 1000);

  return {
    endpoint: url,
    totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    durationMs: totalDuration,
    p50Ms: p50,
    p95Ms: p95,
    p99Ms: p99,
    avgLatencyMs: Math.round(avg * 10) / 10,
    rps: Math.round(rps * 10) / 10,
  };
}

async function main() {
  const baseUrl = process.env.BENCHMARK_BASE_URL || "http://localhost:3000";
  console.log("🎯 Benchmarking Base URL: %s", baseUrl);

  const endpoints = [
    { name: "Public Landing Page", url: `${baseUrl}/` },
    { name: "Public Club Schedule", url: `${baseUrl}/club/schedule` },
    { name: "Login Screen", url: `${baseUrl}/login` },
  ];

  const results: BenchmarkResult[] = [];
  for (const ep of endpoints) {
    try {
      const res = await runBenchmark(ep.name, ep.url, 20, 4);
      results.push(res);
    } catch (err) {
      console.warn("Could not benchmark endpoint %s: %o", ep.name, err);
    }
  }

  console.log("\n📊 Benchmark Summary Table:");
  console.table(results);
}

main().catch(console.error);
