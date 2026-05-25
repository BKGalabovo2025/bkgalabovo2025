import { Member, Sale } from "@/types";

export const checkIsMemberOverdue = (
  member: Member | null,
  familyMembers: Member[] = [],
  sales: Sale[] = []
): { isOverdue: boolean; reason: string | null } => {
  if (!member || member.status !== "active") {
    return { isOverdue: false, reason: "Неактивен член" };
  }

  // Списък с неплатени задължения
  type Obligation = {
    date: Date;
    description: string;
    amount: number;
  };

  const obligations: Obligation[] = [];

  // Проверяваме за неплатени магазинни продажби за члена и неговото семейство
  const targetMemberIds = [member.id, ...familyMembers.map((m) => m.id)];

  const pendingSales = sales.filter(
    (sale) =>
      targetMemberIds.includes(sale.memberId || "") &&
      (sale.status === "pending" || sale.isPaid === false)
  );

  pendingSales.forEach((sale) => {
    let namePrefix = "";
    if (sale.memberId !== member.id && familyMembers.length > 0) {
      const sibling = familyMembers.find((m) => m.id === sale.memberId);
      if (sibling) {
        namePrefix = `${sibling.firstName}: `;
      } else {
        namePrefix = "Семейство: ";
      }
    }

    const itemsStr =
      sale.items.map((i) => i.name).join(", ") || "Услуга/Продукт";

    obligations.push({
      date: new Date(sale.saleDate),
      description: `${namePrefix}${itemsStr}`,
      amount: sale.totalAmount,
    });
  });

  // Ако има неплатени задължения, ги сортираме хронологично и ги връщаме
  if (obligations.length > 0) {
    obligations.sort((a, b) => a.date.getTime() - b.date.getTime());
    const totalDue = obligations.reduce((sum, o) => sum + o.amount, 0);

    const details = obligations
      .map((o) => {
        const dateStr = o.date.toLocaleDateString("bg-BG", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return `${o.description} (${dateStr} - ${o.amount} €)`;
      })
      .join(", ");

    return {
      isOverdue: true,
      reason: `Дължи общо ${totalDue} € за: ${details}`,
    };
  }

  return {
    isOverdue: false,
    reason: "Няма чакащи задължения",
  };
};
