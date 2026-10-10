import {ThinkingOrb} from "@/components/spaceui/thinking";
import {Skeleton} from "@/components/spaceui/skeleton";
export function WorkspaceLoading(){
 return <section className="ux-shell ul-route-loading" aria-busy="true" aria-label="Loading workspace"><div className="ul-thinking-loading" role="status"><ThinkingOrb variant="working" surface="paper" size={112} aria-hidden="true"/><span>Loading your workspace</span></div><Skeleton className="h-4 w-24"/><Skeleton className="mt-4 h-8 w-56"/><Skeleton className="mt-3 h-4 w-full max-w-md"/><div className="ul-loading-cards">{Array.from({length:4},(_,index)=><Skeleton key={index} className="h-32 rounded-xl"/>)}</div><Skeleton className="h-72 w-full rounded-xl"/><span className="ux-visually-hidden">Loading your workspace</span></section>;
}
