import { getSupabaseAdmin } from "@/lib/supabase";
import StudyApp from "@/components/StudyApp";
import { notFound } from "next/navigation";

export default async function StudyPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const supabase = getSupabaseAdmin();

  const [memberRes, allMembersRes] = await Promise.all([
    supabase.from("study_members").select("*").eq("id", memberId).single(),
    supabase.from("study_members").select("*").order("role").order("created_at"),
  ]);

  if (memberRes.error || !memberRes.data) return notFound();
  const member = memberRes.data;
  if (member.role !== "child") return notFound();

  const allMembers = allMembersRes.data ?? [];

  return <StudyApp member={member} allMembers={allMembers} />;
}
