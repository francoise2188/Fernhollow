import { cookies } from "next/headers";
import {
  FERNHOLLOW_AUTH_COOKIE,
  FERNHOLLOW_AUTH_VALUE,
} from "@/lib/auth-constants";

export { FERNHOLLOW_AUTH_COOKIE, FERNHOLLOW_AUTH_VALUE };

export async function readAuthFromCookies(): Promise<boolean> {
  const store = await cookies();
  return store.get(FERNHOLLOW_AUTH_COOKIE)?.value === FERNHOLLOW_AUTH_VALUE;
}
