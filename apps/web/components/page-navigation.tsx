import Link from "next/link";
import {pageHref} from "@/lib/pagination";
export function PageNavigation({path,page,hasMore,filters={}}:{path:string;page:number;hasMore:boolean;filters?:Record<string,string|undefined>}) {
 if(page===1&&!hasMore)return null;
 return <nav aria-label="Results pages" className="ux-notification-controls">
 {page>1&&<Link className="text-link" href={pageHref(path,page-1,filters)}>← Previous</Link>}
 <span aria-current="page">Page {page}</span>
 {hasMore&&page<1000&&<Link className="text-link" href={pageHref(path,page+1,filters)}>Next →</Link>}
 </nav>;
}
