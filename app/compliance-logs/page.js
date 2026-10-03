import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ComplianceLogsClient from "./ComplianceLogsClient";

export default async function ComplianceLogsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "Owner" && session.role !== "Manager") redirect("/dashboard");
  return <ComplianceLogsClient />;
}
