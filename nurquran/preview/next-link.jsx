// Preview-only stand-in for next/link: turns "/tasbeeh" into "#tasbeeh".
export const toHash = (href) => (!href || href === "/" ? "#" : href.startsWith("/") ? "#" + href.slice(1) : href);
export default function Link({ href, children, ...rest }) {
  return <a href={toHash(href)} {...rest}>{children}</a>;
}
