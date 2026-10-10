import {ThinkingOrb} from "@/components/spaceui/thinking";
import {Skeleton} from "@/components/spaceui/skeleton";

export default function Loading(){
  return <div className="ux-shell ux-loading" aria-busy="true" aria-label="Loading marketplace">
    <div className="ul-thinking-loading" role="status"><ThinkingOrb variant="searching" surface="paper" size={112} aria-hidden="true"/><span>Loading marketplace content</span></div>
    <Skeleton className="h-6 w-28 rounded-full"/>
    <Skeleton className="mt-12 h-16 w-full max-w-3xl rounded-2xl"/>
    <Skeleton className="mt-5 h-14 w-full max-w-xl rounded-xl"/>
    <div className="ux-loading-grid">
      {Array.from({length:4},(_,i)=><Skeleton className="h-44 w-full rounded-3xl" key={i}/>)}
    </div>
    <span className="ux-visually-hidden">Loading marketplace content</span>
  </div>;
}
