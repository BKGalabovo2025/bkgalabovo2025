
import { ShadowWizard } from "@/components/training/ShadowWizard"; // Force recompile

export const metadata = {
  title: "Shadow Training | BK Galabovo",
};

export default function ShadowTrainingPage() {
  return (
    <div className="flex-1 w-full flex flex-col items-center min-h-full pb-20 pt-4 px-4 bg-zinc-50 dark:bg-black overflow-y-auto">
      <div className="w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Shadow Training</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Интерактивен треньор за движения по корта.
          </p>
        </div>

        <ShadowWizard />
      </div>
    </div>
  );
}
