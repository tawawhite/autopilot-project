import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import {
  MantineProvider,
  createEmotionCache,
  ColorSchemeProvider,
} from "@mantine/core";
import type { ColorScheme } from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Autopilot Project",
  viewport: "width=device-width,initial-scale=1",
});

createEmotionCache({ key: "mantine" });

export default function App() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <html lang="en">
        <head>
          <StylesPlaceholder />
          <Meta />
          <Links />
          <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛩️</text></svg>"
          />
        </head>
        <body>
          <ColorSchemeProvider
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
          >
            <Outlet />
            <ScrollRestoration />
            <Scripts />
            <LiveReload />
          </ColorSchemeProvider>
        </body>
      </html>
    </MantineProvider>
  );
}
