import NewSaleClient from "./NewSaleClient";

export const dynamic = "force-dynamic";

export default function NewSalePage() {
  return (
    <div className="pb-12 duration-500 animate-in fade-in">
      <NewSaleClient />
    </div>
  );
}
