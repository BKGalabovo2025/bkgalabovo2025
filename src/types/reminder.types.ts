export interface Reminder {
  id: string;
  title: string;
  dueDate: Date;
  recipient: string; // Member ID
  status: "pending" | "completed";
}
