import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import IssuesClient from "./IssuesClient";

export default async function IssuesPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const canManage = session.role === "Owner" || session.role === "Manager";
  return <IssuesClient canManage={canManage} />;
}
