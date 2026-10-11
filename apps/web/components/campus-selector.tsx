import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {selectCampus} from "@/lib/campus-actions";
export async function CampusSelector(){
 const context=await verifiedMarketplaceContext();
 if(context.kind!=="ready"||context.campuses.length<2)return null;
 return <form action={selectCampus} className="ux-notification-controls">
 <label htmlFor="active-campus">Campus</label>
 <select id="active-campus" name="campus" defaultValue={context.campusId}>
 {context.campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
 </select><button type="submit">Switch campus</button></form>;
}
