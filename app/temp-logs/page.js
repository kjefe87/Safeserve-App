import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TempLogsClient from "./TempLogsClient";

export default async function TempLogsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  return <TempLogsClient />;
}
