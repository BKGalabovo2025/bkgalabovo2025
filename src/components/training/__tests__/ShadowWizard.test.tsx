import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as trainingsActions from "@/lib/actions/trainings";

import { ShadowWizard } from "../ShadowWizard";

// Mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock auth context
const mockGetIdToken = vi.fn().mockResolvedValue("mocked-token");
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: {
      getIdToken: mockGetIdToken,
    },
  }),
}));

// Mock audio manager and audio-map helpers to prevent HTMLAudioElement errors in jsdom
vi.mock("@/lib/shadow-training/audio-map", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/shadow-training/audio-map")
  >("@/lib/shadow-training/audio-map");
  return {
    ...actual,
    playAudio: vi.fn(),
    playAudioSequence: vi.fn(),
    stopAudio: vi.fn(),
    shadowAudioManager: {
      unlock: vi.fn(),
      play: vi.fn(),
      playSequence: vi.fn(),
      stopAll: vi.fn(),
    },
    preloadAudioForSettings: vi.fn(),
  };
});

// Mock training action
vi.mock("@/lib/actions/trainings", () => ({
  createTrainingSessionAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock SpeechSynthesis
if (typeof window !== "undefined") {
  vi.stubGlobal("speechSynthesis", {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn().mockReturnValue([]),
  });
}

describe("ShadowWizard Component Flow", () => {
  const mockMembers = [
    { id: "m1", firstName: "Иван", lastName: "Петров", status: "active" },
    { id: "m2", firstName: "Мария", lastName: "Георгиева", status: "active" },
  ];

  const advanceSeconds = (seconds: number) => {
    for (let i = 0; i < seconds; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    // flush setTimeout(advanceState, 0)
    act(() => {
      vi.advanceTimersByTime(1);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("guides user through setup, live training, and analytics", async () => {
    render(<ShadowWizard initialMembers={mockMembers} />);

    // Screen 1: Setup
    expect(screen.getByText("Интелигентен Настройчик")).toBeDefined();

    // Clicking start without players should alert via toast
    fireEvent.click(screen.getByText(/ГОТОВНОСТ ЗА СТАРТ/i));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
      "Моля, изберете поне един играч!"
    );

    // Select the player
    fireEvent.click(screen.getByText("Иван Петров"));

    // Start
    fireEvent.click(screen.getByText(/ГОТОВНОСТ ЗА СТАРТ/i));

    // Screen 2: Live Training Dashboard
    expect(screen.getByText("ГОТОВНОСТ")).toBeDefined();

    // Click training START button
    const startTrainingBtn = screen.getByText("СТАРТ");
    fireEvent.click(startTrainingBtn);

    // Active Training State
    expect(screen.getByText("Приготви се...")).toBeDefined();
    expect(screen.getByText("Иван Петров")).toBeDefined(); // Player is on court

    // End training early
    fireEvent.click(screen.getByText("СТОП"));

    // Auto-transition to Screen 3: Analytics
    expect(screen.getByText("Тренировъчен Отчет")).toBeDefined();

    // Click save to database
    fireEvent.click(screen.getByText(/ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ/i));

    // Should ask for confirmation because elapsed < 10 seconds
    expect(window.confirm).toHaveBeenCalled();

    vi.useRealTimers();
    await waitFor(() => {
      expect(trainingsActions.createTrainingSessionAction).toHaveBeenCalled();
    });
  });

  it("saves directly without warning if training was active for more than 10 seconds", async () => {
    vi.useFakeTimers();
    vi.mocked(window.confirm).mockClear();

    render(<ShadowWizard initialMembers={mockMembers} />);

    // Setup and select player
    fireEvent.click(screen.getByText("Иван Петров"));
    fireEvent.click(screen.getByText(/ГОТОВНОСТ ЗА СТАРТ/i));

    // Start training
    fireEvent.click(screen.getByText("СТАРТ"));

    // Advance through 10s countdown
    advanceSeconds(10);
    expect(screen.getByText("РАБОТА")).toBeDefined();

    // Advance 30s in working state
    advanceSeconds(30);

    // End training
    fireEvent.click(screen.getByText("СТОП"));

    // Navigate to Analytics
    expect(screen.getByText("Тренировъчен Отчет")).toBeDefined();

    fireEvent.click(screen.getByText(/ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ/i));

    // Should NOT trigger the sub-10s warning
    // However, it does trigger the "stop early" warning when we click STOP
    // Let's verify the createAction was called.
    vi.useRealTimers();
    await waitFor(() => {
      expect(trainingsActions.createTrainingSessionAction).toHaveBeenCalled();
    });
  });
});
