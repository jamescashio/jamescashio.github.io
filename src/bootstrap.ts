import { scheduleClientActivation } from "@/lib/client-activation";

scheduleClientActivation(() => {
  return import("./main");
});
