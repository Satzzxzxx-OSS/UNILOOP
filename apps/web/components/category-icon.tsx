type CategorySymbol =
  | "book" | "laptop" | "phone" | "home"
  | "bike" | "bag" | "ball" | "camera";

export function CategoryIcon({ name }: { name: CategorySymbol }) {
  const shared = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: 27,
    height: 27,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "book":
      return <svg {...shared}><path d="M12 6.5C9.5 5 6 5 3 6v13c3-1 6.5-1 9 .7 2.5-1.7 6-1.7 9-.7V6c-3-1-6.5-1-9 .5Z" /><path d="M12 6.5V19.7" /></svg>;
    case "laptop":
      return <svg {...shared}><rect x="4.5" y="5" width="15" height="11.5" rx="1.5"/><path d="M2 19h20l-1.7-2.5H3.7L2 19Z"/></svg>;
    case "phone":
      return <svg {...shared}><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg>;
    case "home":
      return <svg {...shared}><path d="m3 11 9-7 9 7v9H3v-9Z"/><path d="M9 20v-7h6v7"/></svg>;
    case "bike":
      return <svg {...shared}><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="m5.5 17 4.2-8 4.3 8H5.5m8.5 0 3-10h-3M8 7h3"/></svg>;
    case "bag":
      return <svg {...shared}><path d="M4 8h16l1 13H3L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
    case "ball":
      return <svg {...shared}><circle cx="12" cy="12" r="9.5"/><path d="m12 6 4 3-1.5 5h-5L8 9l4-3Zm-4 3L4.5 8M9.5 14l-3 5M14.5 14l3 5M16 9l3.5-1"/></svg>;
    case "camera":
      return <svg {...shared}><path d="M3 8h4l2-3h6l2 3h4v12H3V8Z"/><circle cx="12" cy="14" r="3.5"/></svg>;
  }
}
