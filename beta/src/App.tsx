import { useEffect } from "react";
import { usePath, navigate } from "@tinymachines/kit/lib/router";
import { useAccount } from "@tinymachines/kit/lib/account";
import { describe } from "@tinymachines/kit/lib/seo";
import { applyHead } from "@tinymachines/kit/lib/head";
import { SiteHeader } from "@tinymachines/kit/components/SiteHeader";
import { SiteFooter } from "@tinymachines/kit/components/SiteFooter";
import { UpdateBar } from "@tinymachines/kit/components/UpdateBar";
import { SharePanel } from "@tinymachines/kit/components/SharePanel";
import ThemePage from "@tinymachines/kit/pages/ThemePage";
import SensorsPage from "@tinymachines/kit/pages/SensorsPage";
import SharePage from "@tinymachines/kit/pages/SharePage";
import AppPage from "@tinymachines/kit/pages/AppPage";
import Account from "@tinymachines/kit/pages/Account";
import FilesPage from "@tinymachines/kit/pages/FilesPage";
import Home from "./pages/Home";
import Zoo, { Widgets } from "./pages/Zoo";
import Start from "./pages/Start";
import NotHere from "./pages/NotHere";
import Contact from "./pages/Contact";
import { ZoomControl } from "./components/ZoomControl";

export function App() {
  const path = usePath();
  const load = useAccount((s) => s.load);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (path === "/open") navigate("/", { replace: true }); }, [path]);
  useEffect(() => { applyHead(describe(location.pathname, location.search)); }, [path]);
  let page: React.ReactNode;
  if (path === "/") page = <Home />;
  else if (path === "/zoo") page = <Zoo />;
  else if (path === "/zoo/widgets") page = <Widgets />;
  else if (path === "/start") page = <Start />;
  else if (path === "/contact") page = <Contact />;
  else if (path === "/theme") page = <ThemePage />;
  else if (path === "/sensors") page = <SensorsPage />;
  else if (path === "/share") page = <SharePage />;
  else if (path === "/app") page = <AppPage />;
  else if (path === "/account") page = <Account />;
  else if (path === "/files") page = <FilesPage />;
  else page = <NotHere path={path} />;
  return (
    <>
      <SiteHeader path={path} />
      <ZoomControl />
      <UpdateBar />
      <main>{page}</main>
      <SiteFooter path={path} />
      <SharePanel />
    </>
  );
}
