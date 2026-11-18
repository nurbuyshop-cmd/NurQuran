// Preview-only stand-in for next/navigation.
import { toHash } from "./next-link";
export function useRouter() {
  return {
    push: (href) => { location.hash = toHash(href); },
    back: () => { location.hash = ""; },
  };
}
