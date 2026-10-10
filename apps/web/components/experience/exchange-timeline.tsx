import {Timeline,TimelineItem,TimelineIndicator,TimelineSeparator,TimelineHeader,TimelineTitle,TimelineContent} from "@/components/spaceui/timeline";

/** Read-only presentation of existing records, never advances an exchange. */
export function ExchangeTimeline({title,steps}:{title:string;steps:{title:string;description:string;done:boolean|undefined}[]}){
 const completed=steps.findIndex(step=>!step.done);
 const value=completed===-1?steps.length-1:completed-1;
 return <section className="ul-exchange-timeline" aria-label={title}><h2>{title}</h2>
  <Timeline value={value} orientation="vertical">{steps.map((step,i)=><TimelineItem step={i} key={step.title} data-completed={step.done||undefined}>
   <TimelineIndicator/><TimelineSeparator/><TimelineHeader><TimelineTitle>{step.title}</TimelineTitle><span className="ul-timeline-state">{step.done===undefined?"Not available":step.done?"Recorded":"Not recorded"}</span></TimelineHeader>
   <TimelineContent>{step.description}</TimelineContent>
  </TimelineItem>)}</Timeline>
 </section>;
}
