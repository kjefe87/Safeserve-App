import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import StaffCertsClient from "./StaffCertsClient";

export default async function StaffCertsPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "Owner" && session.role !== "Manager") redirect("/dashboard");
  return <StaffCertsClient />;
}
