import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // 🔐 Auth gate for the entire app section
  if (!token) {
    redirect("/login");
  }

  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
    </>
  );
}
