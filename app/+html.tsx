import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";
export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
      :root { color-scheme: light; --paper:#F5F3ED; --ink:#253C3C; --teal:#236963; }
      body { background:var(--paper); color:var(--ink); }
      [role="button"]:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline:2px solid var(--teal); outline-offset:3px; }
      @media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto !important; animation:none !important; transition:none !important; } }
    `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
