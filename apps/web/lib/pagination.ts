/** Bounded page windows; IDs break timestamp ties in every caller. */
export function pageWindow(raw: unknown, size = 24) {
 const value = typeof raw === "string" && /^[1-9][0-9]{0,3}$/.test(raw) ? Number(raw) :
  typeof raw === "number" && Number.isInteger(raw) ? raw : 1;
 const page = Math.min(1000, Math.max(1, value));
 const limit = Math.min(50, Math.max(1, Math.floor(size) || 24));
 return {page, size:limit, from:(page-1)*limit, to:page*limit};
}
export function pageHref(path:string, page:number, filters:Record<string,string|undefined>={}) {
 const params = new URLSearchParams();
 for(const [key,value] of Object.entries(filters)) if(value && key!=="page") params.set(key,value);
 params.set("page",String(pageWindow(page).page));
 return path+"?"+params.toString();
}
