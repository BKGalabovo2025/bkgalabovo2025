import NewSaleClient from "./NewSaleClient";

export const dynamic = "force-dynamic";

export default function NewSalePage() {
  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <NewSaleClient />
    </div>
  );
}
