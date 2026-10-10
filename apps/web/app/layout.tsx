import type {Metadata,Viewport} from "next";
import type {ReactNode} from "react";
import "./globals.css";
import "./experience.css";
import "./space-theme.css";
import "./dashboard.css";
import "./refinements.css";
import "./journey.css";
import "./heading-card-emphasis.css";
import "./account-profile-spaceui.css";
import "./auth-split.css";

export const metadata:Metadata={
  title:{default:"UNILOOP — Buy better. Borrow smarter.",template:"%s · UNILOOP"},
  description:"Find your next useful thing. Buy, sell, rent and lend with thoughtful local connections.",
  applicationName:"UNILOOP",
  robots:{index:false,follow:false},
};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#ffffff"};

export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
