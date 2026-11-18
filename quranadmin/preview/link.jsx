import { go } from "./router";
export default function Link({ href, children, onClick, ...rest }) {
  return <a href={href} {...rest} onClick={(e) => { e.preventDefault(); onClick && onClick(e); go(href); }}>{children}</a>;
}
