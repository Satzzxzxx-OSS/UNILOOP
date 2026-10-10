import {StatusBadge} from "@/components/spaceui/status-badge";
const tones:Record<string,"available"|"offline"|"warning"|"info"|"error">={active:"available",completed:"available",returned:"available",draft:"offline",removed:"offline",cancelled:"offline",rejected:"offline",paused:"warning",requested:"info",approved:"info",pending_handover:"warning",disputed:"error"};
export function ItemStatus({status}:{status:string}){
 return <StatusBadge variant="outline" size="xs" status={tones[status]??"info"} animated={false} primaryText={status.replaceAll("_"," ")} className="ul-item-status"/>;
}
