import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";

export default function ReservationsPage() {
  return (
    <div className="pb-12">
      <ReservationsClient />
    </div>
  );
}
