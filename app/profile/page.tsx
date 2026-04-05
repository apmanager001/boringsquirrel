import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Profile",
  description: "Legacy profile route that now redirects to settings.",
  path: "/profile",
  noIndex: true,
});

export default async function ProfilePage() {
  redirect("/settings");
}
