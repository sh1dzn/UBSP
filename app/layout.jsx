import { Suspense } from "react";
import "../src/styles/tokens.css";
import "../src/styles/base.css";
import "../src/styles/shell.css";
import "../src/engine/engine.css";
import "../src/views/public.css";
import "../src/views/cabinet.css";
import "../src/views/admin/admin.css";
import "../src/views/modules.css";
import "../src/ai/assistant.css";
import PortalShell from "../src/shell/PortalShell.jsx";

export const metadata = {
  title: "ЕППБ — Единый портал поддержки бизнеса",
  description:
    "Единая цифровая точка входа к мерам поддержки бизнеса группы Байтерек: подбор, подача заявки, отслеживание статуса.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PortalShell>
          <Suspense fallback={null}>{children}</Suspense>
        </PortalShell>
      </body>
    </html>
  );
}
