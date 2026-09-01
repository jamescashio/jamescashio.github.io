import { scheduleClientActivation } from "@/lib/client-activation";

const initialHash = window.location.hash;
const deferForSnapshotPaint = initialHash === "" || initialHash === "#deck=snapshot";

scheduleClientActivation(() => import("./main").then(({ clientReady }) => clientReady), window, {
  defer: deferForSnapshotPaint,
});
