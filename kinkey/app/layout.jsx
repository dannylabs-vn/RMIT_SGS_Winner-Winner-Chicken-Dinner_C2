import { TideCloakProvider } from "@tidecloak/nextjs";
import adapter from "../tidecloak.json";
import Header from "../components/Header";
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
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lora:ital,wght@1,400;1,500&display=swap"
        />
      </head>
      <body>
        <TideCloakProvider config={{ ...adapter }}>
          <Header />
          <main className="page">{children}</main>
        </TideCloakProvider>
      </body>
    </html>
  );
}
