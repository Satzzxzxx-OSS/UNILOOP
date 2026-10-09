import "server-only";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { cleanSearchQuery,parseCategory } from "@/lib/catalog";
import { isUuid } from "@/lib/interactions/validation";

export type RentalItem={
  id:string;owner_id:string;campus_id:string;category_slug:string;
  title:string;description:string;daily_rate_inr:number;
  refundable_deposit_inr:number;min_days:number;max_days:number;
  item_condition:string;status:string;created_at:string;
  published_at:string|null;photo_url?:string|null;
};
export type RentalBooking={
  id:string;rental_id:string;owner_id:string;renter_id:string;
  booking_period:string;days_count:number;daily_rate_snapshot_inr:number;
  rental_total_inr:number;deposit_snapshot_inr:number;status:string;
  owner_handover_at:string|null;renter_handover_at:string|null;
  owner_return_at:string|null;renter_return_at:string|null;created_at:string;
};
export type RentalResult={
  kind:"ready"|"login"|"unconfigured"|"not_eligible"|"error";
  items:RentalItem[];
};
const rentalSelect="id,owner_id,campus_id,category_slug,title,description,daily_rate_inr,refundable_deposit_inr,min_days,max_days,item_condition,status,created_at,published_at";
const bookingSelect="id,rental_id,owner_id,renter_id,booking_period,days_count,daily_rate_snapshot_inr,rental_total_inr,deposit_snapshot_inr,status,owner_handover_at,renter_handover_at,owner_return_at,renter_return_at,created_at";

export async function discoverRentals({category,search,limit=18}:{
  category?:string|null;search?:string;limit?:number;
}={}):Promise<RentalResult>{
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {kind:context.kind,items:[]};
  let query=context.client.from("rental_listings")
    .select(rentalSelect).eq("campus_id",context.campusId)
    .eq("status","active").order("published_at",{ascending:false})
    .limit(Math.min(Math.max(limit,1),24));
  const selected=parseCategory(category);
  if(selected)query=query.eq("category_slug",selected);
  const safe=cleanSearchQuery(search);
  if(safe)query=query.ilike("title","%"+safe.replace(/[\\%_]/g,"\\$&")+"%");
  const {data,error}=await query;
  if(error)return {kind:"error",items:[]};
  const items=(data??[]) as RentalItem[];
  if(!items.length)return {kind:"ready",items};
  const {data:photos}=await context.client.from("rental_photos")
    .select("rental_id,storage_path,position")
    .in("rental_id",items.map(r=>r.id)).order("position",{ascending:true});
  const covers=new Map<string,string>();
  for(const row of photos??[])if(!covers.has(row.rental_id))covers.set(row.rental_id,row.storage_path);
  return {kind:"ready",items:await Promise.all(items.map(async item=>{
    const path=covers.get(item.id);
    if(!path)return {...item,photo_url:null};
    const {data:signed,error:signError}=await context.client.storage.from("rental-media")
      .createSignedUrl(path,120);
    return {...item,photo_url:signError?null:signed?.signedUrl??null};
  }))};
}

export async function getRental(rentalId:string){
  if(!isUuid(rentalId))return null;
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return null;
  const {data,error}=await context.client.from("rental_listings").select(rentalSelect)
    .eq("id",rentalId).eq("campus_id",context.campusId).maybeSingle();
  if(error||!data)return null;
  const item=data as RentalItem;
  const [photosResult,busyResult]=await Promise.all([
    context.client.from("rental_photos").select("storage_path,position")
      .eq("rental_id",item.id).order("position",{ascending:true}).limit(5),
    context.client.rpc("get_rental_busy_periods",{requested_rental:item.id}),
  ]);
  const urls=await Promise.all((photosResult.data??[]).map(async p=>{
    const {data:signed,error:signError}=await context.client.storage.from("rental-media")
      .createSignedUrl(p.storage_path,120);
    return signError?null:signed?.signedUrl??null;
  }));
  return {item,myId:context.userId,photos:urls.filter((v):v is string=>Boolean(v)),
    photoCount:photosResult.data?.length??0,
    unavailable:busyResult.error?[]:(busyResult.data??[]) as Array<{start_date:string;return_date:string}>};
}

export async function getMyRentalListings():Promise<RentalResult>{
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {kind:context.kind,items:[]};
  const {data,error}=await context.client.from("rental_listings")
    .select(rentalSelect).eq("campus_id",context.campusId)
    .eq("owner_id",context.userId).neq("status","removed")
    .order("created_at",{ascending:false}).limit(30);
  return error?{kind:"error",items:[]}:{kind:"ready",items:(data??[]) as RentalItem[]};
}

export async function getRentalBookings(){
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {kind:context.kind,items:[] as RentalBooking[]};
  const {data,error}=await context.client.from("rental_bookings")
    .select(bookingSelect).order("created_at",{ascending:false}).limit(50);
  return error?{kind:"error" as const,items:[] as RentalBooking[]}:
    {kind:"ready" as const,items:(data??[]) as RentalBooking[]};
}

export async function getRentalBooking(id:string){
  if(!isUuid(id))return null;
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return null;
  const {data,error}=await context.client.from("rental_bookings")
    .select(bookingSelect).eq("id",id).maybeSingle();
  if(error||!data)return null;
  const booking=data as RentalBooking;
  const [itemResponse,notes]=await Promise.all([
    context.client.from("rental_listings").select("id,title,status")
      .eq("id",booking.rental_id).maybeSingle(),
    context.client.from("rental_condition_notes")
      .select("id,author_id,stage,note,created_at")
      .eq("booking_id",booking.id).order("created_at",{ascending:true}).limit(50),
  ]);
  return {booking,item:itemResponse.data,myId:context.userId,notes:notes.data??[]};
}
