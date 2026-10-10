/* Export from Space UI Squishmoji @usespaceui/squishmoji 0.1.0.
 * createAvatar('UNILOOP', {shape:'ghost',expression:'happy',backgroundStyle:'solid'}).
 * https://www.spaceui.one/tools/avatars?type=squishmoji
 * MIT: docs/licenses/SPACE-UI-MIT.txt. No custom bot artwork or network calls. */
import Image from 'next/image';
export function AuthBotAvatar({large=false}:{large?:boolean}){
 return <span className="un-auth-squishmoji" data-testid="uniloop-auth-avatar">
  <Image src="/avatars/spaceui-squishmoji.svg" width={large?88:64} height={large?88:64} alt="Space UI Squishmoji companion"/>
 </span>;
}
