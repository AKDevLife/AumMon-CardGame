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
import { AppLayout } from "./AppLayout.tsx";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
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
