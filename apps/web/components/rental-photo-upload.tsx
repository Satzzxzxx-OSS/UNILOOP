"use client";

import {useState,type ChangeEvent} from "react";
import {browserSupabase} from "@/lib/supabase/browser";

const allowed:Record<string,string>={
  "image/jpeg":"jpg","image/png":"png","image/webp":"webp",
};
const maxSize=5*1024*1024;

export function RentalPhotoUpload({rentalId,count}:{rentalId:string;count:number}){
  const [busy,setBusy]=useState(false),[status,setStatus]=useState("");
  async function handleFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    event.target.value="";
    if(!file||busy)return;
    const ext=allowed[file.type];
    if(!ext||file.size<1||file.size>maxSize){
      setStatus("Choose a JPEG, PNG or WebP below 5 MB.");return;
    }
    const supabase=browserSupabase();
    if(!supabase){setStatus("Storage is unavailable.");return;}
    setBusy(true);
    setStatus("Uploading photo…");
    try{
      const {data:photos,error:readError}=await supabase.from("rental_photos")
        .select("position").eq("rental_id",rentalId);
      if(readError){setStatus("Unable to check photo slots.");return;}
      const used=new Set((photos??[]).map(p=>Number(p.position)));
      const position=[1,2,3,4,5].find(n=>!used.has(n));
      if(!position){setStatus("Maximum five photos.");return;}
      const path=rentalId+"/"+crypto.randomUUID()+"."+ext;
      const {error:uploadError}=await supabase.storage.from("rental-media")
        .upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError){setStatus("Upload failed; check file type/size and retry.");return;}
      const {error:registerError}=await supabase.from("rental_photos").insert({
        rental_id:rentalId,storage_path:path,position,
      });
      if(registerError){
        await supabase.storage.from("rental-media").remove([path]);
        setStatus("Photo could not be registered. Please retry.");return;
      }
      setStatus("Photo saved.");
      window.location.reload();
    }catch{
      setStatus("Upload failed. Try again later.");
    }finally{setBusy(false);}
  }
  return <section className="photo-upload">
    <label htmlFor="rent-photo">Photos ({count}/5)</label>
    <input id="rent-photo" type="file" accept="image/jpeg,image/png,image/webp"
      disabled={busy||count>=5} onChange={handleFile}/>
    <p className="photo-help">Private upload. JPEG, PNG or WebP; 5 MB maximum.</p>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
