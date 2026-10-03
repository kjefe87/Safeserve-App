import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import InspectionClient from "./InspectionClient";

export default async function InspectionPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role !== "Owner" && session.role !== "Manager") redirect("/dashboard");
  return <InspectionClient />;
}
