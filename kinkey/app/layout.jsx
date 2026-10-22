import { TideCloakProvider } from "../components/tide";
import adapter from "../tidecloak.json";
import Shell from "../components/Shell";
import "./globals.css";

export const metadata = {
  title: "KinKey: a family safe with no key-holder",
  description: "A family safe whose key to money and documents is granted only by the family quorum. Built on TideCloak.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap"
        />
      </head>
      <body>
        <TideCloakProvider config={{ ...adapter }}>
          <Shell>{children}</Shell>
        </TideCloakProvider>
      </body>
    </html>
  );
}
