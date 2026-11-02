import { lazy, Suspense, useEffect, type ComponentType, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingScreen, Spinner } from "@/components/ui/States";
import { useAuth } from "@/store/auth";
import { DraftImporter } from "@/components/DraftImporter";
import Home from "@/pages/Home";

const L = <P,>(f: () => Promise<{ default: ComponentType<P> }>) => lazy(f);
const named = (name: string) => () =>
  import("@/pages/Auth").then((m) => ({ default: (m as unknown as Record<string, ComponentType>)[name] }));

const Login = L(named("Login"));
const Signup = L(named("Signup"));
const Forgot = L(named("Forgot"));
const Reset = L(named("Reset"));
const Dashboard = L(() => import("@/pages/Dashboard"));
const Pantry = L(() => import("@/pages/Pantry"));
const Generate = L(() => import("@/pages/Generate"));
const RecipePage = L(() => import("@/pages/RecipePage"));
const Chef = L(() => import("@/pages/Chef"));
const Photo = L(() => import("@/pages/Photo"));
const Modes = L(() => import("@/pages/Modes"));
const Substitution = L(() => import("@/pages/Substitution"));
const Planner = L(() => import("@/pages/Planner"));
const Shopping = L(() => import("@/pages/Shopping"));
const MyRecipes = L(() => import("@/pages/MyRecipes"));
const Profile = L(() => import("@/pages/Profile"));
const Plans = L(() => import("@/pages/Plans"));
const Settings = L(() => import("@/pages/Settings"));
const Legal = L(() => import("@/pages/Legal"));

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner label="Carregando…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return <>{children}</>;
}

export default function App() {
  const init = useAuth((s) => s.init);
  const loading = useAuth((s) => s.loading);
  useEffect(() => init(), [init]);

  if (loading) return <LoadingScreen />;

  const p = (el: ReactNode) => <Protected>{el}</Protected>;
  return (
    <AppShell>
      <DraftImporter />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Signup />} />
          <Route path="/recuperar-senha" element={<Forgot />} />
          <Route path="/redefinir-senha" element={<Reset />} />
          <Route path="/painel" element={p(<Dashboard />)} />
          <Route path="/ingredientes" element={p(<Pantry />)} />
          <Route path="/gerar" element={p(<Generate />)} />
          {/* Receita: leitura permitida a quem tem o link quando o dono tornou pública (RLS decide) */}
          <Route path="/receita/:id" element={<RecipePage />} />
          <Route path="/chef-ia" element={p(<Chef />)} />
          <Route path="/foto" element={p(<Photo />)} />
          <Route path="/modos" element={p(<Modes />)} />
          <Route path="/substituicao" element={p(<Substitution />)} />
          <Route path="/planejamento" element={p(<Planner />)} />
          <Route path="/lista-compras" element={p(<Shopping />)} />
          <Route path="/minhas-receitas" element={p(<MyRecipes />)} />
          <Route path="/perfil" element={p(<Profile />)} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/configuracoes" element={p(<Settings />)} />
          <Route path="/privacidade" element={<Legal kind="privacy" />} />
          <Route path="/termos" element={<Legal kind="terms" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
