import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="pb-12">
      <SettingsClient />
    </div>
  );
}
