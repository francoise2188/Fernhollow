import { ForestPath } from "@/components/ForestPath";
import { Gate } from "@/components/Gate";
import { readAuthFromCookies } from "@/lib/auth";

export default async function Home() {
  const authed = await readAuthFromCookies();
  return authed ? <ForestPath /> : <Gate />;
}
