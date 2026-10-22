"use client";

// One import point for TideCloak. "live" uses the official SDK; "simulated" uses
// Tide's Plan C stand-in. The mode is fixed at build time by next.config.mjs.
import * as live from "@tidecloak/nextjs";
import * as sim from "./SimTide";

export const SIMULATED = process.env.NEXT_PUBLIC_TIDE_MODE === "simulated";const impl = SIMULATED ? sim : live;

export const TideCloakProvider = impl.TideCloakProvider;
export const useTideCloak = impl.useTideCloak;
export const Authenticated = impl.Authenticated;
export const Unauthenticated = impl.Unauthenticated;
