const workspaceRoots=["/dashboard","/explore","/post","/my","/listing","/inbox","/offers","/saved","/settings","/report","/rent","/rentals","/transactions","/notifications"];
export function isWorkspacePath(pathname:string):boolean{
 return workspaceRoots.some(root=>pathname===root||pathname.startsWith(root+"/"));
}
