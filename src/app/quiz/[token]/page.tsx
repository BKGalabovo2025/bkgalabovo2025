import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import QuizPlayer from "./quiz-player";

export const dynamic = "force-dynamic";

export default async function QuizTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          <Loader2 className="size-10 animate-spin text-indigo-500" />
        </div>
      }
    >
      <QuizPlayer token={token} />
    </Suspense>
  );
}