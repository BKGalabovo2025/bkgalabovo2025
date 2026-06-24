import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShadowWizard } from "../ShadowWizard";
import * as trainingsActions from "@/lib/actions/trainings";

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
  };
});

// Mock training action
vi.mock("@/lib/actions/trainings", () => ({
  createTrainingSessionAction: vi.fn().mockResolvedValue({ success: true }),
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
    // flush microtasks
    act(() => {
      vi.advanceTimersByTime(0);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("guides user through all 5 steps of the wizard and starts training", async () => {
    render(<ShadowWizard initialMembers={mockMembers} />);

    // Step 1: Режим на тренировка
    expect(screen.getByText("1. Режим на тренировка")).toBeDefined();
    const nextBtn = screen.getByText("Напред");
    fireEvent.click(nextBtn);

    // Step 2: Участници и Ротация
    expect(screen.getByText("2. Участници и Ротация")).toBeDefined();

    // Clicking next should trigger alert because no players are selected
    fireEvent.click(screen.getByText("Напред"));
    expect(window.alert).toHaveBeenCalledWith(
      "Моля, изберете поне един играч!"
    );

    // Check the checkbox for the first player
    const checkbox = screen.getByLabelText("Иван Петров");
    fireEvent.click(checkbox);

    // Proceed to Step 3
    fireEvent.click(screen.getByText("Напред"));

    // Step 3: Време и Програма
    expect(screen.getByText("3. Време и Програма")).toBeDefined();
    fireEvent.click(screen.getByText("Напред"));

    // Step 4: Разширени опции
    expect(screen.getByText("4. Разширени опции")).toBeDefined();

    // Start the training wizard step transition
    const startBtn = screen.getByText("СТАРТИРАЙ ТРЕНИРОВКА");
    fireEvent.click(startBtn);

    // Now on step 5, click the actual training START button
    const startTrainingBtn = screen.getByText("СТАРТ");
    fireEvent.click(startTrainingBtn);

    // Step 5: Active Training Screen
    expect(screen.getByText("Приготви се...")).toBeDefined();
    expect(screen.getByText("Иван Петров")).toBeDefined(); // Current active player on court
  });

  it("allows saving a completed session and warns if elapsed time is less than 10 seconds", async () => {
    vi.useFakeTimers();

    render(<ShadowWizard initialMembers={mockMembers} />);

    // Step 1 -> 2
    fireEvent.click(screen.getByText("Напред"));

    // Select player
    fireEvent.click(screen.getByLabelText("Иван Петров"));
    fireEvent.click(screen.getByText("Напред"));

    // Step 3 -> 4
    fireEvent.click(screen.getByText("Напред"));

    // Step 4 -> Start training wizard step
    fireEvent.click(screen.getByText("СТАРТИРАЙ ТРЕНИРОВКА"));

    // Click training START button
    fireEvent.click(screen.getByText("СТАРТ"));

    // Countdown active
    expect(screen.getByText("Приготви се...")).toBeDefined();

    // End training early
    fireEvent.click(screen.getByText("СТОП"));

    // Should show finished screen overlay with "Запази в историята"
    const saveBtn = screen.getByText("Запази в историята");
    expect(saveBtn).toBeDefined();

    // Clicking save should trigger warning confirmation since elapsed time is 0s (< 10s threshold)
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    const finalSaveBtn = screen.getByText("Запази Окончателно");
    expect(finalSaveBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(finalSaveBtn);
    });

    expect(window.confirm).toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });
    expect(trainingsActions.createTrainingSessionAction).toHaveBeenCalled();
  });

  it("saves directly without warning if training was active for more than 10 seconds", async () => {
    vi.useFakeTimers();
    vi.mocked(window.confirm).mockClear();

    render(<ShadowWizard initialMembers={mockMembers} />);

    // Quick navigation to step 5
    fireEvent.click(screen.getByText("Напред"));
    fireEvent.click(screen.getByLabelText("Иван Петров"));
    fireEvent.click(screen.getByText("Напред"));
    fireEvent.click(screen.getByText("Напред"));
    fireEvent.click(screen.getByText("СТАРТИРАЙ ТРЕНИРОВКА"));
    fireEvent.click(screen.getByText("СТАРТ"));

    // Advance through 10s countdown
    advanceSeconds(10);
    expect(screen.getByText("РАБОТА")).toBeDefined();

    // Advance 30s in working state
    advanceSeconds(30);

    // End training
    fireEvent.click(screen.getByText("СТОП"));

    const saveBtn = screen.getByText("Запази в историята");

    await act(async () => {
      fireEvent.click(saveBtn);
    });

    const finalSaveBtn = screen.getByText("Запази Окончателно");

    await act(async () => {
      fireEvent.click(finalSaveBtn);
    });

    // Should NOT trigger the sub-10s warning
    expect(window.confirm).not.toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });
    expect(trainingsActions.createTrainingSessionAction).toHaveBeenCalled();
  });

  it("allows closing without saving, resetting to step 1", async () => {
    render(<ShadowWizard initialMembers={mockMembers} />);

    // Step 1 -> 2
    fireEvent.click(screen.getByText("Напред"));

    // Select player
    fireEvent.click(screen.getByLabelText("Иван Петров"));
    fireEvent.click(screen.getByText("Напред"));

    // Step 3 -> 4
    fireEvent.click(screen.getByText("Напред"));

    // Step 4 -> Start training wizard step
    fireEvent.click(screen.getByText("СТАРТИРАЙ ТРЕНИРОВКА"));

    // Click training START button
    fireEvent.click(screen.getByText("СТАРТ"));

    // End training early
    fireEvent.click(screen.getByText("СТОП"));

    // Should show finished screen overlay with "Затвори без запис"
    const closeBtn = screen.getByText("Затвори без запис");
    expect(closeBtn).toBeDefined();

    fireEvent.click(closeBtn);

    // Should ask for confirmation and then reset to Step 1
    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByText("1. Режим на тренировка")).toBeDefined();
  });
});
