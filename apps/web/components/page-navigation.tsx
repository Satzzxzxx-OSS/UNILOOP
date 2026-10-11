import Link from "next/link";
import {pageHref} from "@/lib/pagination";
export function PageNavigation({path,page,hasMore,filters={},pageKey="page"}:{path:string;page:number;hasMore:boolean;filters?:Record<string,string|undefined>;pageKey?:"page"|"offerPage"}) {
 if(page===1&&!hasMore)return null;
 return <nav aria-label="Results pages" className="ux-notification-controls">
 {page>1&&<Link className="text-link" href={pageHref(path,page-1,filters,pageKey)}>← Previous</Link>}
 <span aria-current="page">Page {page}</span>
 {hasMore&&page<1000&&<Link className="text-link" href={pageHref(path,page+1,filters,pageKey)}>Next →</Link>}
 </nav>;
}
