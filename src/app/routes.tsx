import type { RouteObject } from "react-router";
import { AdminPage } from "../features/admin/AdminPage.tsx";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { PrivacyPage, TermsPage } from "../features/legal/LegalPages.tsx";
import { ProfilePage } from "../features/profile/ProfilePage.tsx";
import { LobbyPage } from "../features/online/LobbyPage.tsx";
import { OnlinePage } from "../features/online/OnlinePage.tsx";
import { SoloSetupPage } from "../features/solo/SoloSetupPage.tsx";
import { GamePage } from "../features/game/GamePage.tsx";
import { TutorialPage } from "../features/tutorial/TutorialPage.tsx";
import { BluffGame } from "../features/party/BluffGame.tsx";
import { MePage } from "../features/party/MePage.tsx";
import { PartyHome } from "../features/party/PartyHome.tsx";
import { PartyJoin } from "../features/party/PartyJoin.tsx";
import { PartyLobby } from "../features/party/PartyLobby.tsx";
import { PartyShell } from "../features/party/PartyShell.tsx";
import { AppLayout } from "./AppLayout.tsx";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";

export const routes: RouteObject[] = [
  {
    element: <PartyShell />,
    children: [
      { index: true, element: <PartyHome /> },
      { path: "join/:code", element: <PartyJoin /> },
      { path: "party/lobby/:roomId", element: <PartyLobby /> },
      { path: "party/game/:matchId", element: <BluffGame /> },
      { path: "me", element: <MePage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      // EDO Battle is hidden in v2 (Q1: deferred, kept): reachable only by URL.
      { path: "edo", element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "terms", element: <TermsPage /> },
      { path: "play/solo", element: <SoloSetupPage /> },
      { path: "tutorial", element: <TutorialPage /> },
      { path: "play/online", element: <OnlinePage /> },
      { path: "lobby/:roomId", element: <LobbyPage /> },
      { path: "game/:matchId", element: <GamePage /> },
      { path: "games/:gameId/solo", element: <SoloSetupPage /> },
      { path: "games/:gameId/online", element: <OnlinePage /> },
      { path: "admin", element: <AdminPage /> },
      { path: "admin/:section", element: <AdminPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
