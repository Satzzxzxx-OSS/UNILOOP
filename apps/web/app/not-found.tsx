import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container quiet-page">
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1>Looks like this loop ends here.</h1>
      <p>We couldn’t find the page you were looking for.</p>
      <Link href="/" className="button button-dark">Go home <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
