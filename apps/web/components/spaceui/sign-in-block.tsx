/* Adapted from the public MIT Space UI Sign In Page block.
 * https://www.spaceui.one/r/block-sign-in.json
 * src/registry/blocks/sign-in/sign-in-1/index.tsx @ 7b22c0b
 * Preserves its 384px card, centered header, labeled credential fields and footer.
 * Adaptations: shared local primitives; signup intent; real email form fallback;
 * testing-only navigation replaces demo attempt counters and placeholder providers.
 * License: docs/licenses/SPACE-UI-MIT.txt. */
import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight} from 'lucide-react';
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle} from '@/components/spaceui/card';
import {Input} from '@/components/spaceui/input';
import {Button} from '@/components/spaceui/button';

export function SignInBlock({signup,avatar,preview,children}:{signup:boolean;avatar:ReactNode;preview:boolean;children:ReactNode}){
 return <Card className="un-auth-block" style={{maxWidth:384,borderRadius:16}}>
  <CardHeader className="un-auth-block-header">
   {avatar}
   <CardTitle render={<h1/>}>{signup?'Create your account':'Welcome back'}</CardTitle>
   <CardDescription>{signup?'Your next useful connection starts here.':'Sign in to your personal marketplace.'}</CardDescription>
  </CardHeader>
  <CardContent className="un-auth-block-content">
   {preview?<>
    {signup&&<div className="un-auth-field"><label htmlFor="preview-name">Full name</label><Input id="preview-name" name="name" autoComplete="name" placeholder="Your name" maxLength={100}/></div>}
    <div className="un-auth-field"><label htmlFor="preview-email">Email address</label><Input id="preview-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254}/></div>
    <div className="un-auth-field"><label htmlFor="preview-password">Password</label><Input id="preview-password" name="password" type="password" autoComplete={signup?'new-password':'current-password'} placeholder="Enter your password"/></div>
    <Button className="un-auth-continue" size="lg" render={<Link href="/dashboard"/>}>{signup?'Create account':'Sign in'}<ArrowRight size={16}/></Button>
    <p className="un-auth-preview-note">Frontend preview · continue without verification.<br/>These fields are not submitted or saved.</p>
   </>:children}
  </CardContent>
  <CardFooter className="un-auth-block-footer">
   <p>{signup?'Already have an account?':'New to UNILOOP?'} <Link href={signup?'/login':'/signup'}>{signup?'Sign in':'Create an account'}</Link></p>
  </CardFooter>
 </Card>;
}
