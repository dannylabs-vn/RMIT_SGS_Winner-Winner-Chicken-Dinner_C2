import { createDpopRoute } from "@tidecloak/nextjs/server";
import config from "../../../tidecloak.json";

// Serve the SDK's relay with its required CSP, scoped to this realm/client.
export const { GET, HEAD } = createDpopRoute({ config });
