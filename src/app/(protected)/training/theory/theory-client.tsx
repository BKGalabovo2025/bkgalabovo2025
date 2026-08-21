"use client";

import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit,
  History,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getAllMembers } from "@/services/member-service";
import { quizService } from "@/services/quiz-service";
import { useAppStore } from "@/store/use-app-store";
import type { Member } from "@/types";
import type { Quiz, QuizQuestion, TheoryResult } from "@/types/quiz.types";

export default function TheoryClient() {
  const { activeBranch } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [pendingResults, setPendingResults] = useState<TheoryResult[]>([]);
  const [sentResults, setSentResults] = useState<TheoryResult[]>([]);
  const [reviewedResults, setReviewedResults] = useState<TheoryResult[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Send modal
  const [sendQuiz, setSendQuiz] = useState<Quiz | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Edit modal
  const [editQuiz, setEditQuiz] = useState<Quiz | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editQuestions, setEditQuestions] = useState<QuizQuestion[]>([]);

  // Review modal
  const [reviewResult, setReviewResult] = useState<TheoryResult | null>(null);
  const [manualScore, setManualScore] = useState(0);
  const [coachFeedback, setCoachFeedback] = useState("");

  // Builder
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newQuestions, setNewQuestions] = useState<QuizQuestion[]>([]);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const load = async () => {
    setIsLoading(true);
    try {
      await quizService.seedBaseQuizzes(activeBranch);
      const [quizData, pendingData, sentData, reviewedData, memberData] =
        await Promise.all([
          quizService.getQuizzes(activeBranch),
          quizService.getPendingResults(activeBranch),
          quizService.getSentResults(activeBranch),
          quizService.getReviewedResults(activeBranch),
          getAllMembers(),
        ]);
      setQuizzes(quizData);
      setPendingResults(pendingData);
      setSentResults(sentData);
      setReviewedResults(reviewedData);
      setMembers(memberData.filter((m: Member) => !m.isCoach));
    } catch (err) {
      console.error("Theory load error:", err);
      toast.error("Грешка при зареждане");
    } finally {
      setIsLoading(false);
    }
  };

  // ── SEND ─────────────────────────────────────────────────────────────────
  const handleGenerateLink = async () => {
    let memberName = "";
    let memberId = "";

    if (selectedMemberId === "custom") {
      memberName = memberSearchQuery.trim();
      memberId = "custom-" + uuidv4();
    } else {
      const member = members.find((m) => m.id === selectedMemberId);
      if (!member) return;
      memberName = member.name;
      memberId = member.id;
    }

    if (!sendQuiz || !memberName) return;
    try {
      const shareToken = await quizService.submitResult({
        token: uuidv4(),
        answers: {},
        playerId: memberId,
        playerName: memberName,
        quizId: sendQuiz.id,
        quizTitle: sendQuiz.title,
        siteId: activeBranch,
        autoScore: 0,
      });
      const url = `${window.location.origin}/quiz/${shareToken}`;
      setGeneratedLink(url);
    } catch (err) {
      console.error("Theory generate link error:", err);
      toast.error("Грешка при генериране на линк");
    }
  };

  const copyLink = () => {
    void navigator.clipboard.writeText(generatedLink);
    toast.success("Линкът е копиран!");
  };

  const openViber = (playerName: string) => {
    if (!sendQuiz || !playerName) return;
    const viberUrl = quizService.generateViberLink(
      playerName,
      sendQuiz.title,
      generatedLink
    );
    window.location.href = viberUrl;
  };

  // ── EDIT ─────────────────────────────────────────────────────────────────
  const openEdit = (quiz: Quiz) => {
    setEditQuiz(quiz);
    setEditTitle(quiz.title);
    setEditDescription(quiz.description);
    setEditQuestions(
      JSON.parse(JSON.stringify(quiz.questions)) as QuizQuestion[]
    );
  };

  const saveEdit = async () => {
    if (!editQuiz) return;
    try {
      await quizService.updateQuiz(editQuiz.id, {
        title: editTitle,
        description: editDescription,
        questions: editQuestions,
        isCustom: true,
      });
      toast.success("Тестът е обновен!");
      setEditQuiz(null);
      void load();
    } catch (err) {
      console.error("Theory save edit error:", err);
      toast.error("Грешка при запазване");
    }
  };

  const resetToBase = async () => {
    if (!editQuiz?.baseTemplateId) return;
    try {
      await quizService.resetQuizToDefault(
        editQuiz.id,
        editQuiz.baseTemplateId
      );
      toast.success("Тестът е върнат към оригиналния шаблон!");
      setEditQuiz(null);
      void load();
    } catch (err) {
      console.error("Theory reset to base error:", err);
      toast.error("Грешка при нулиране");
    }
  };

  const updateQuestion = (
    idx: number,
    field: keyof QuizQuestion,
    value: unknown
  ) => {
    setEditQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // ── BUILDER ──────────────────────────────────────────────────────────────
  const addQuestion = (type: "SINGLE_CHOICE" | "OPEN_TEXT") => {
    setNewQuestions((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        text: "",
        options: type === "SINGLE_CHOICE" ? ["", "", ""] : undefined,
        correctAnswer: 0,
        points: type === "SINGLE_CHOICE" ? 8 : 28,
      },
    ]);
  };

  const saveNewQuiz = async () => {
    if (!newTitle || newQuestions.length === 0) {
      toast.error("Добави заглавие и поне един въпрос");
      return;
    }
    try {
      await quizService.createQuiz(activeBranch, {
        title: newTitle,
        description: newDesc,
        questions: newQuestions,
        isCustom: true,
        isBaseTemplate: false,
      });
      toast.success("Новият тест е създаден!");
      setNewTitle("");
      setNewDesc("");
      setNewQuestions([]);
      setActiveTab("library");
      void load();
    } catch (err) {
      console.error("Theory create quiz error:", err);
      toast.error("Грешка при създаване");
    }
  };

  // ── REVIEW ───────────────────────────────────────────────────────────────
  const openReview = (r: TheoryResult) => {
    setReviewResult(r);
    setManualScore(r.manualScore ?? 0);
    setCoachFeedback(r.coachFeedback ?? "");
  };

  const submitReview = async () => {
    if (!reviewResult) return;
    try {
      await quizService.reviewResult(
        reviewResult.id,
        manualScore,
        reviewResult.autoScore,
        coachFeedback
      );
      toast.success("Рецензията е записана! 🎉");
      setReviewResult(null);
      void load();
    } catch (err) {
      console.error("Theory submit review error:", err);
      toast.error("Грешка при запазване на рецензията");
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да изтриете този резултат? Това действие е необратимо."
      )
    )
      return;
    try {
      await quizService.deleteResult(id);
      toast.success("Резултатът е изтрит успешно.");
      void load();
    } catch (err) {
      console.error("Theory delete result error:", err);
      toast.error("Грешка при изтриване");
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────
  type TabId = "library" | "builder" | "sent" | "review" | "history";

  const tabs: {
    id: TabId;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "library",
      label: "Библиотека",
      icon: <BookOpen className="size-4" />,
    },
    { id: "builder", label: "Конструктор", icon: <Plus className="size-4" /> },
    {
      id: "sent",
      label: "Изпратени",
      icon: <Send className="size-4" />,
      count: sentResults.length,
    },
    {
      id: "review",
      label: "За Проверка",
      icon: <MessageSquare className="size-4" />,
      count: pendingResults.length,
    },
    { id: "history", label: "История", icon: <History className="size-4" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-900 uppercase">
          <Sparkles className="size-6 text-indigo-500" />
          Теория и Викторини
        </h1>
        <p className="mt-1 text-zinc-500">
          Детска бадминтон академия — конструктор на тестове и система за
          рецензия
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1 sm:grid-cols-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`relative flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all sm:px-4 sm:text-sm ${activeTab === t.id ? "bg-white text-indigo-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(" ")[0]}</span>
            {t.count != null && t.count > 0 && (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════ LIBRARY ══════════════════════════ */}
      {activeTab === "library" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="overflow-hidden rounded-2xl border-zinc-200 shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge
                      variant="secondary"
                      className={`mb-2 text-[10px] ${quiz.isCustom ? "bg-amber-100 text-amber-700" : "bg-white/20 text-white"}`}
                    >
                      {quiz.isCustom ? "✏️ Редактиран" : "📚 Базов"}
                    </Badge>
                    <h3 className="leading-tight font-bold text-white">
                      {quiz.title}
                    </h3>
                  </div>
                  <Trophy className="size-5 shrink-0 text-white/70" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="mb-3 line-clamp-2 text-sm text-zinc-500">
                  {quiz.description}
                </p>
                <div className="mb-4 flex items-center gap-2 text-xs text-zinc-400">
                  <span>{quiz.questions.length} въпроса</span>
                  <span>•</span>
                  <span>до 100 т.</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => openEdit(quiz)}
                  >
                    <Edit className="mr-1 size-3" /> Редактирай
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setSendQuiz(quiz);
                      setGeneratedLink("");
                      setSelectedMemberId("");
                    }}
                  >
                    <Send className="mr-1 size-3" /> Изпрати
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════ BUILDER ══════════════════════════ */}
      {activeTab === "builder" && (
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="rounded-2xl border-zinc-200">
            <CardContent className="space-y-4 p-6">
              <div>
                <Label className="mb-1 font-bold">Заглавие на теста</Label>
                <Input
                  placeholder="напр. Шампион по правилата 🏆"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1 font-bold">Описание (за децата)</Label>
                <Textarea
                  placeholder="Кратко описание на теста..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="rounded-xl"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {newQuestions.map((q, idx) => (
            <Card key={q.id} className="rounded-2xl border-zinc-200">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <Badge
                    className={`text-xs ${q.type === "OPEN_TEXT" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}
                  >
                    {q.type === "OPEN_TEXT"
                      ? "🧠 Тактическа мисия"
                      : `❓ Въпрос с избор (${q.points} т.)`}
                  </Badge>
                  <button
                    type="button"
                    onClick={() =>
                      setNewQuestions((p) => p.filter((_, i) => i !== idx))
                    }
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <Input
                  placeholder="Текст на въпроса..."
                  value={q.text}
                  onChange={(e) =>
                    setNewQuestions((p) => {
                      const c = [...p];
                      c[idx] = { ...c[idx], text: e.target.value };
                      return c;
                    })
                  }
                  className="rounded-xl"
                />
                {q.type === "SINGLE_CHOICE" &&
                  q.options?.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${q.correctAnswer === oi ? "bg-green-500 text-white" : "bg-zinc-100 text-zinc-500"}`}
                      >
                        {["А", "Б", "В"][oi]}
                      </span>
                      <Input
                        placeholder={`Вариант ${["А", "Б", "В"][oi]}...`}
                        value={opt}
                        onChange={(e) =>
                          setNewQuestions((p) => {
                            const c = [...p];
                            const opts = [...(c[idx].options ?? [])];
                            opts[oi] = e.target.value;
                            c[idx] = { ...c[idx], options: opts };
                            return c;
                          })
                        }
                        className="rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewQuestions((p) => {
                            const c = [...p];
                            c[idx] = { ...c[idx], correctAnswer: oi };
                            return c;
                          })
                        }
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${q.correctAnswer === oi ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500 hover:bg-green-50"}`}
                      >
                        {q.correctAnswer === oi ? (
                          <Check className="size-3" />
                        ) : (
                          "Верен?"
                        )}
                      </button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => addQuestion("SINGLE_CHOICE")}
            >
              <Plus className="mr-2 size-4" /> Въпрос с избор (8 т.)
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => addQuestion("OPEN_TEXT")}
            >
              <MessageSquare className="mr-2 size-4" /> Тактическа мисия (28 т.)
            </Button>
          </div>
          <Button
            className="w-full rounded-xl bg-indigo-600 py-6 text-base font-bold hover:bg-indigo-700"
            onClick={() => void saveNewQuiz()}
          >
            <Sparkles className="mr-2 size-5" /> Запази Новия Тест
          </Button>
        </div>
      )}

      {/* ══════════════════════════════════ SENT ══════════════════════════════ */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {sentResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-20 text-center">
              <Send className="mx-auto mb-4 size-10 text-zinc-300" />
              <h3 className="font-bold text-zinc-700">
                Няма изпратени тестове
              </h3>
              <p className="text-sm text-zinc-400">
                Изпратете тест от библиотеката, за да го видите тук.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">
                Тези тестове са изпратени, но детето все още не ги е отворило
                или попълнило.
              </p>
              {sentResults.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <Send className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{r.playerName}</p>
                      <p className="text-sm text-zinc-500">{r.quizTitle}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">
                        Изпратен:{" "}
                        {new Date(r.submittedAt).toLocaleString("bg-BG")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-white text-[10px] text-amber-700"
                    >
                      ⏳ Чака отговор
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-xl text-zinc-400 hover:text-zinc-700"
                      onClick={() => {
                        const url = `${window.location.origin}/quiz/${r.shareToken}`;
                        void navigator.clipboard.writeText(url);
                        toast.success("Линкът е копиран!");
                      }}
                    >
                      <Copy className="mr-1 size-3.5" /> Копирай линк
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════ REVIEW ═══════════════════════════ */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {pendingResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-20 text-center">
              <Check className="mx-auto mb-4 size-10 text-green-400" />
              <h3 className="font-bold text-zinc-700">Всичко е проверено!</h3>
              <p className="text-sm text-zinc-400">
                Нямате непроверени тестове в момента.
              </p>
            </div>
          ) : (
            pendingResults.map((r) => (
              <Card
                key={r.id}
                className="overflow-hidden rounded-2xl border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (expandedReview === r.id) {
                      setExpandedReview(null);
                      setReviewResult(null);
                    } else {
                      setExpandedReview(r.id);
                      openReview(r);
                    }
                  }}
                  className="flex w-full items-center justify-between p-5 text-left transition-all hover:bg-zinc-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-indigo-500" />
                      <span className="font-bold text-zinc-900">
                        {r.playerName}
                      </span>
                      <Badge className="bg-amber-100 text-[10px] text-amber-700">
                        PENDING
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {r.quizTitle} •{" "}
                      {new Date(r.submittedAt).toLocaleString("bg-BG", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Автоматични: {r.autoScore} т.
                    </p>
                  </div>
                  {expandedReview === r.id ? (
                    <ChevronUp className="size-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="size-4 text-zinc-400" />
                  )}
                </button>
                {expandedReview === r.id && (
                  <div className="space-y-4 border-t border-zinc-100 p-5">
                    {quizzes
                      .find((q) => q.id === r.quizId)
                      ?.questions.filter((q) => q.type === "SINGLE_CHOICE")
                      .map((q, i) => {
                        const userAnswer = r.answers?.[q.id];
                        return (
                          <div
                            key={q.id}
                            className="rounded-xl border border-zinc-200 bg-white p-3"
                          >
                            <p className="mb-2 text-xs font-bold text-zinc-800">
                              {i + 1}. {q.text}
                            </p>
                            <div className="space-y-1">
                              {q.options?.map((opt, optIdx) => {
                                const isSelected = userAnswer === optIdx;
                                const isActuallyCorrect =
                                  q.correctAnswer === optIdx;
                                let bgClass = "text-zinc-600";
                                let bgClassCircle = "bg-zinc-200 text-zinc-500";
                                if (isActuallyCorrect) {
                                  bgClass =
                                    "bg-emerald-50 text-emerald-800 font-bold";
                                  bgClassCircle = "bg-emerald-500 text-white";
                                } else if (isSelected) {
                                  bgClass = "bg-red-50 text-red-800";
                                  bgClassCircle = "bg-red-500 text-white";
                                }
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${bgClass}`}
                                  >
                                    <div
                                      className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${bgClassCircle}`}
                                    >
                                      {["А", "Б", "В"][optIdx] ??
                                        String(optIdx + 1)}
                                    </div>
                                    <span>{opt}</span>
                                    {isSelected && (
                                      <span className="ml-auto text-[10px] opacity-70">
                                        отговор на детето
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    {(() => {
                      const quiz = quizzes.find((q) => q.id === r.quizId);
                      const openQ = quiz?.questions.find(
                        (q) => q.type === "OPEN_TEXT"
                      );
                      if (!openQ && !r.tacticalAnswer) return null;
                      const maxPoints = openQ?.points || 28;

                      return (
                        <div className="mb-4 rounded-xl bg-indigo-50 p-4">
                          <p className="mb-2 text-xs font-bold text-indigo-700 uppercase">
                            Тактическа мисия
                          </p>
                          {openQ && (
                            <p className="mb-3 text-sm font-semibold text-zinc-800">
                              {openQ.text}
                            </p>
                          )}
                          <div className="mb-4 rounded-lg border border-indigo-100 bg-white p-3">
                            <p className="mb-1 text-[10px] font-bold text-zinc-400 uppercase">
                              Отговор на детето:
                            </p>
                            <p className="text-sm text-zinc-700">
                              {r.tacticalAnswer || (
                                <span className="text-zinc-400 italic">
                                  Няма отговор
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="mb-1 font-bold text-indigo-900">
                              Оцени отговора (0–{maxPoints} точки)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={maxPoints}
                              value={manualScore}
                              onChange={(e) =>
                                setManualScore(Number(e.target.value))
                              }
                              className="rounded-xl bg-white"
                            />
                          </div>
                        </div>
                      );
                    })()}
                    <div>
                      <Label className="mb-1 font-bold">
                        Рецензия / Препоръка от Треньора
                      </Label>
                      <Textarea
                        placeholder='напр. "Супер си с правилата, но научи по-добре точкуването при двойки!"'
                        value={coachFeedback}
                        onChange={(e) => setCoachFeedback(e.target.value)}
                        className="rounded-xl"
                        rows={3}
                      />
                    </div>
                    <Button
                      className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => void submitReview()}
                    >
                      <Check className="mr-2 size-4" /> Одобри и Запиши в
                      Досието
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════ HISTORY ═══════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {reviewedResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 py-20 text-center">
              <History className="mx-auto mb-4 size-10 text-zinc-300" />
              <h3 className="font-bold text-zinc-700">Няма история</h3>
              <p className="text-sm text-zinc-400">
                Все още нямате проверени тестове.
              </p>
            </div>
          ) : (
            reviewedResults.map((r) => (
              <Card
                key={r.id}
                className="overflow-hidden rounded-2xl border-zinc-200"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (expandedReview === r.id) setExpandedReview(null);
                    else setExpandedReview(r.id);
                  }}
                  className="flex w-full items-center justify-between p-5 text-left transition-all hover:bg-zinc-50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-emerald-500" />
                      <span className="font-bold text-zinc-900">
                        {r.playerName}
                      </span>
                      <Badge className="bg-emerald-100 text-[10px] text-emerald-700">
                        REVIEWED
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {r.quizTitle} •{" "}
                      {r.reviewedAt
                        ? new Date(r.reviewedAt).toLocaleString("bg-BG", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(r.submittedAt).toLocaleString("bg-BG", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Точки: {r.totalScore} (Авто: {r.autoScore} / Тактика:{" "}
                      {r.manualScore})
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteResult(r.id);
                      }}
                      className="text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    {expandedReview === r.id ? (
                      <ChevronUp className="size-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="size-4 text-zinc-400" />
                    )}
                  </div>
                </button>
                {expandedReview === r.id && (
                  <div className="space-y-4 border-t border-zinc-100 p-5">
                    {quizzes
                      .find((q) => q.id === r.quizId)
                      ?.questions.filter((q) => q.type === "SINGLE_CHOICE")
                      .map((q, i) => {
                        const userAnswer = r.answers?.[q.id];
                        return (
                          <div
                            key={q.id}
                            className="rounded-xl border border-zinc-200 bg-white p-3"
                          >
                            <p className="mb-2 text-xs font-bold text-zinc-800">
                              {i + 1}. {q.text}
                            </p>
                            <div className="space-y-1">
                              {q.options?.map((opt, optIdx) => {
                                const isSelected = userAnswer === optIdx;
                                const isActuallyCorrect =
                                  q.correctAnswer === optIdx;
                                let bgClass = "text-zinc-600";
                                let bgClassCircle = "bg-zinc-200 text-zinc-500";
                                if (isActuallyCorrect) {
                                  bgClass =
                                    "bg-emerald-50 text-emerald-800 font-bold";
                                  bgClassCircle = "bg-emerald-500 text-white";
                                } else if (isSelected) {
                                  bgClass = "bg-red-50 text-red-800";
                                  bgClassCircle = "bg-red-500 text-white";
                                }
                                return (
                                  <div
                                    key={optIdx}
                                    className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${bgClass}`}
                                  >
                                    <div
                                      className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${bgClassCircle}`}
                                    >
                                      {["А", "Б", "В"][optIdx] ??
                                        String(optIdx + 1)}
                                    </div>
                                    <span>{opt}</span>
                                    {isSelected && (
                                      <span className="ml-auto text-[10px] opacity-70">
                                        отговор на детето
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    {(() => {
                      const quiz = quizzes.find((q) => q.id === r.quizId);
                      const openQ = quiz?.questions.find(
                        (q) => q.type === "OPEN_TEXT"
                      );
                      if (!openQ && !r.tacticalAnswer) return null;
                      return (
                        <div className="rounded-xl bg-indigo-50 p-4">
                          <p className="mb-2 text-xs font-bold text-indigo-700 uppercase">
                            Тактическа мисия
                          </p>
                          {openQ && (
                            <p className="mb-3 text-sm font-semibold text-zinc-800">
                              {openQ.text}
                            </p>
                          )}
                          <div className="rounded-lg border border-indigo-100 bg-white p-3">
                            <p className="mb-1 text-[10px] font-bold text-zinc-400 uppercase">
                              Отговор на детето:
                            </p>
                            <p className="text-sm text-zinc-700">
                              {r.tacticalAnswer || (
                                <span className="text-zinc-400 italic">
                                  Няма отговор
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    {r.coachFeedback && (
                      <div className="rounded-xl bg-purple-50 p-4">
                        <p className="mb-1 text-xs font-bold text-purple-700 uppercase">
                          Рецензия от треньора
                        </p>
                        <p className="text-sm text-purple-800 italic">
                          &quot;{r.coachFeedback}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ══════════ SEND MODAL ════════════════════════════════════════════════ */}
      <Dialog
        open={!!sendQuiz}
        onOpenChange={(o) => {
          if (!o) setSendQuiz(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="size-5 text-indigo-500" /> Изпрати по Viber /
              Линк
            </DialogTitle>
            <DialogDescription>{sendQuiz?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="font-bold">Търси и избери дете</Label>
              <Input
                placeholder="Въведи име..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="rounded-xl"
              />
              <ScrollArea className="h-40 rounded-xl border border-zinc-200 bg-white">
                <div className="space-y-1 p-2">
                  {members
                    .filter((m) =>
                      m.name
                        .toLowerCase()
                        .includes(memberSearchQuery.toLowerCase())
                    )
                    .map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedMemberId === m.id
                            ? "bg-indigo-100 font-bold text-indigo-700"
                            : "text-zinc-700 hover:bg-zinc-100"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  {members.filter((m) =>
                    m.name
                      .toLowerCase()
                      .includes(memberSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center">
                      <p className="mb-3 text-sm text-zinc-500">
                        Няма намерени деца
                      </p>
                      {memberSearchQuery.trim().length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMemberId("custom")}
                          className={
                            selectedMemberId === "custom"
                              ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                              : ""
                          }
                        >
                          Използвай &quot;{memberSearchQuery.trim()}&quot;
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            {!generatedLink ? (
              <Button
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700"
                onClick={() => void handleGenerateLink()}
                disabled={!selectedMemberId}
              >
                <Sparkles className="mr-2 size-4" /> Генерирай уникален линк
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="rounded-xl text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={copyLink}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
                <Button
                  className="w-full rounded-xl bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    const playerName =
                      selectedMemberId === "custom"
                        ? memberSearchQuery.trim()
                        : members.find((m) => m.id === selectedMemberId)
                            ?.name || "";
                    openViber(playerName);
                  }}
                >
                  <Send className="mr-2 size-4" /> Отвори Viber
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════ EDIT MODAL ════════════════════════════════════════════════ */}
      <Dialog
        open={!!editQuiz}
        onOpenChange={(o) => {
          if (!o) setEditQuiz(null);
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="size-5 text-indigo-500" /> Редактирай Тест
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-2">
              <Input
                placeholder="Заглавие"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-xl"
              />
              <Textarea
                placeholder="Описание"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-xl"
                rows={2}
              />
              {editQuestions.map((q, idx) => (
                <Card key={q.id} className="rounded-xl border-zinc-200">
                  <CardContent className="space-y-2 p-4">
                    <Badge
                      className={`text-[10px] ${q.type === "OPEN_TEXT" ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {q.type === "OPEN_TEXT"
                        ? "Тактическа мисия"
                        : "Въпрос с избор"}
                    </Badge>
                    <Input
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(idx, "text", e.target.value)
                      }
                      className="rounded-xl"
                      placeholder="Текст на въпроса"
                    />
                    {q.type === "SINGLE_CHOICE" &&
                      q.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${q.correctAnswer === oi ? "bg-green-500 text-white" : "bg-zinc-100 text-zinc-500"}`}
                          >
                            {["А", "Б", "В"][oi]}
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...(q.options ?? [])];
                              opts[oi] = e.target.value;
                              updateQuestion(idx, "options", opts);
                            }}
                            className="rounded-xl text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestion(idx, "correctAnswer", oi)
                            }
                            className={`rounded-lg px-2 py-1 text-xs font-bold ${q.correctAnswer === oi ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}
                          >
                            {q.correctAnswer === oi ? "✓" : "Верен?"}
                          </button>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="flex gap-2">
            {editQuiz?.baseTemplateId && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => void resetToBase()}
              >
                <RefreshCw className="mr-2 size-3" /> Нулирай
              </Button>
            )}
            <Button
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={() => void saveEdit()}
            >
              <Check className="mr-2 size-4" /> Запази
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
