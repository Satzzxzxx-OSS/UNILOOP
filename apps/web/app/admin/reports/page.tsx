import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { serverSupabase } from "@/lib/supabase/server";
import { ReviewReportForm } from "@/components/trust-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderation queue", robots: { index: false, follow: false } };

type StaffReport={
 report_id:string;listing_id:string;reason:string;details:string;created_at:string;
};

export default async function ModerationPage(){
  const client=await serverSupabase();
  if(!client) notFound();
  const {data:{user},error}=await client.auth.getUser();
  if(error || !user) notFound();

  const {data,reportsError}=await (async()=>{
    const r=await client.rpc("get_open_listing_reports");
    return {data:r.data,reportsError:r.error};
  })();
  if(reportsError) notFound();

  const reports=(data??[]) as StaffReport[];
  const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
  return <div className="container moderation-page">
    <p className="eyebrow">RESTRICTED OPERATIONS</p>
    <h1>Review queue</h1>
    <p className="conversation-intro">Review submitted reports and record decisions.
      Listing removal is audited. Access is restricted by the database staff role.</p>
    {reports.length?<div className="moderation-queue">{reports.map(r=>
      <article className="moderation-case" key={r.report_id}>
        <span className="eyebrow">{r.reason}</span>
        <h2>Report {r.report_id.slice(0,8)}</h2>
        <p>{r.details}</p>
        <p className="form-helper">Listing reference: {r.listing_id}</p>
        <time dateTime={r.created_at}>{new Date(r.created_at).toLocaleDateString("en-IN")}</time>
        {enabled?<ReviewReportForm id={r.report_id}/>:
          <p className="interaction-notice">Moderation actions are not enabled yet.</p>}
      </article>
    )}</div>:<section className="feed-notice">
      <h2>No open reports</h2><p>The moderation queue is empty.</p>
    </section>}
  </div>;
}
