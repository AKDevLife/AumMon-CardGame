import type { RouteObject } from "react-router";
import { LoginPage } from "../features/auth/LoginPage.tsx";
import { RegisterPage } from "../features/auth/RegisterPage.tsx";
import { MatchPage } from "../features/game/MatchPage.tsx";
import { ProfilePage } from "../features/profile/ProfilePage.tsx";
import { PassPlaySetupPage } from "../features/passplay/PassPlaySetupPage.tsx";
import { SoloSetupPage } from "../features/solo/SoloSetupPage.tsx";
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
      { path: "play/solo", element: <SoloSetupPage /> },
      { path: "play/pass", element: <PassPlaySetupPage /> },
      { path: "match/:matchId", element: <MatchPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
