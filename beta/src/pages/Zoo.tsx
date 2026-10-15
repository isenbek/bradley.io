// /zoo and /zoo/widgets: the kit's widget zoo and widget bench (@tinymachines/kit pages/ZooPage and WidgetBenchPage,
// in the kit since v0.2.0), fed bradley.io's own measured series: commits a day in bradley.io and the kit, from
// their git logs at build time (public/data/activity.json, scripts/data.sh).
import ZooPage, { type ZooData } from "@tinymachines/kit/pages/ZooPage";
import WidgetBenchPage from "@tinymachines/kit/pages/WidgetBenchPage";
import { useActivity, type Activity } from "../activity";

function zooData(a: Activity | null): ZooData | null {
  if (!a) return null;
  return {
    days: a.days,
    unit: ["commit", "commits"],
    label: "Commits, last 60 days",
    across: "across bradley.io and the kit",
    source: `Commits from each repository's git log, read when this site was built (${a.generated.slice(0, 16).replace("T", " ")} UTC).`,
    stat: { k: "Kit version", v: a.repos.kit?.tag ?? "…" },
  };
}

export default function Zoo() {
  return <ZooPage data={zooData(useActivity())} />;
}

export function Widgets() {
  const a = useActivity();
  const lines = a ? Object.entries(a.repos).map(([k, r]) => `${k}: ${r.commits60} commits${r.tag ? `, at ${r.tag}` : ""}`) : [];
  return <WidgetBenchPage data={zooData(a)} ticker={lines} />;
}
