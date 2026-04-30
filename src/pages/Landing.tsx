import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot, Users, BarChart3, Zap, MessageSquare, CheckCircle, ArrowRight,
  Star, TrendingUp, Headphones, Shield, Play,
  Inbox, Tag, FileText, ListFilter, CreditCard,
  Radar, BrainCircuit, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionCheckoutDialog } from "@/components/settings/SubscriptionCheckoutDialog";

/* ─── NandiDev product family bar ───────────────────────────────────────── */

const NANDI_PRODUCTS = [
  {
    id: "multiagente",
    label: "Atendimento Multi-Agente",
    icon: Headphones,
    href: "#",
    active: true,
    badge: null,
  },
  {
    id: "sdr",
    label: "SDR Inteligente",
    icon: BrainCircuit,
    href: "https://nandidev.com.br/sdr",
    active: false,
    badge: "Em breve",
  },
  {
    id: "radar",
    label: "Radar Comercial",
    icon: Radar,
    href: "https://nandidev.com.br/radar",
    active: false,
    badge: "Em breve",
  },
  {
    id: "ia",
    label: "IA Generativa",
    icon: Sparkles,
    href: "https://nandidev.com.br/ia",
    active: false,
    badge: "Em breve",
  },
];

function NandiProductBar() {
  return (
    <div className="border-b border-white/5 bg-[#07070f] px-6 py-0">
      <div className="max-w-6xl mx-auto flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {/* NandiDev brand */}
        <a
          href="https://nandidev.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 pr-5 border-r border-white/10 mr-3 shrink-0 py-3"
        >
          <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
            <MessageSquare className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-bold text-white/80">NandiDev</span>
        </a>

        {/* Products */}
        {NANDI_PRODUCTS.map((p) => (
          <a
            key={p.id}
            href={p.href}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all shrink-0 ${
              p.active
                ? "border-green-500 text-green-400"
                : "border-transparent text-white/40 hover:text-white/70 cursor-default"
            }`}
            onClick={p.active ? (e) => e.preventDefault() : undefined}
          >
            <p.icon className="w-3.5 h-3.5" />
            {p.label}
            {p.badge && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/30 border border-white/10">
                {p.badge}
              </span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── data ──────────────────────────────────────────────────────────────── */

const features = [
  { icon: Inbox,        title: "Caixa de entrada unificada multi-agente",         desc: "Vários atendentes operando ao mesmo tempo na mesma conta WhatsApp sem conflito." },
  { icon: Bot,          title: "Sugestões de resposta com IA",                    desc: "Respostas automáticas no tom certo: Formal, Amigável ou Direto — em segundos." },
  { icon: TrendingUp,   title: "Análise de sentimento em tempo real",             desc: "Saiba se o cliente está satisfeito ou frustrado antes mesmo de responder." },
  { icon: FileText,     title: "Resumos automáticos de conversa",                 desc: "IA gera um resumo do histórico a qualquer momento, sem precisar reler tudo." },
  { icon: ListFilter,   title: "Fila e triagem inteligente",                      desc: "Distribuição automática de conversas por agente, departamento ou carga." },
  { icon: Tag,          title: "Tópicos e categorização automática",              desc: "Cada conversa é categorizada automaticamente para relatórios e priorização." },
  { icon: BarChart3,    title: "Relatórios em tempo real",                        desc: "Dashboard com métricas de atendimento, tempo de resposta e performance por agente." },
  { icon: Zap,          title: "Macros e automações",                             desc: "Respostas prontas, fluxos automáticos e atribuição inteligente de conversas." },
  { icon: Shield,       title: "Segurança e auditoria",                           desc: "Log completo de ações, controle de acesso por papel e webhook com validação." },
];

const steps = [
  { num: "01", title: "Conecte sua conta WhatsApp",   desc: "Escaneie o QR code e conecte em menos de 2 minutos. Nenhuma API oficial necessária." },
  { num: "02", title: "Adicione sua equipe",           desc: "Convide agentes, defina papéis (admin, agente, visualizador) e regras de distribuição." },
  { num: "03", title: "Atenda com IA ao lado",         desc: "A IA sugere respostas, resume conversas e alerta sobre clientes insatisfeitos em tempo real." },
];

const plans = [
  {
    id: "conexao",  name: "Conexão",  price: 197,  setup: 997,
    period: "/mês", description: "Ideal para pequenas operações",
    instances: "1 instância WhatsApp", conversations: "1.000 conversas/mês", members: "3 agentes",
    popular: false,
  },
  {
    id: "equipe",   name: "Equipe",   price: 497,  setup: 1497,
    period: "/mês", description: "Para equipes em crescimento",
    instances: "5 instâncias WhatsApp", conversations: "5.000 conversas/mês", members: "10 agentes",
    popular: true,
  },
  {
    id: "escala",   name: "Escala",   price: 997,  setup: 2497,
    period: "/mês", description: "Para operações de alto volume",
    instances: "20 instâncias WhatsApp", conversations: "20.000 conversas/mês", members: "30 agentes",
    popular: false,
  },
];

const stats = [
  { value: "98%",    label: "satisfação dos clientes" },
  { value: "3×",     label: "mais rápido que atendimento manual" },
  { value: "24/7",   label: "monitoramento e alertas" },
  { value: "< 2min", label: "tempo médio de 1ª resposta" },
];

/* ─── Product mockup ────────────────────────────────────────────────────── */

function ProductMockup() {
  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full scale-75" />

      {/* browser chrome */}
      <div className="relative bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#12121e] border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 mx-3 bg-white/5 rounded px-3 py-0.5 text-xs text-white/30 font-mono">
            app.nandiflow.com.br
          </div>
        </div>

        {/* app layout */}
        <div className="flex h-72">
          {/* sidebar */}
          <div className="w-14 bg-[#0f0f1a] border-r border-white/5 flex flex-col items-center py-3 gap-3">
            <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            {[Users, BarChart3, Zap].map((Icon, i) => (
              <div key={i} className="w-7 h-7 bg-white/5 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-white/30" />
              </div>
            ))}
          </div>

          {/* conversation list */}
          <div className="w-44 border-r border-white/5 flex flex-col">
            <div className="px-2 py-2 border-b border-white/5">
              <div className="bg-white/5 rounded px-2 py-1 text-[10px] text-white/30">Buscar…</div>
            </div>
            {[
              { name: "Empresa ABC", msg: "Preciso de ajuda com...", time: "2m", unread: 2, color: "bg-green-500" },
              { name: "João Silva",  msg: "Quando chega meu pedido?",time: "5m", unread: 0, color: "bg-blue-500" },
              { name: "Maria Costa", msg: "Obrigada pelo atendimento",time: "12m",unread: 0, color: "bg-purple-500" },
              { name: "Tech Ltda",   msg: "Pode me enviar a nota?",  time: "1h", unread: 1, color: "bg-orange-500" },
            ].map((c, i) => (
              <div key={i} className={`flex items-start gap-2 px-2 py-1.5 border-b border-white/5 ${i === 0 ? "bg-green-500/10" : ""}`}>
                <div className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5`}>
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-medium text-white/80 truncate">{c.name}</span>
                    <span className="text-[9px] text-white/30 shrink-0 ml-1">{c.time}</span>
                  </div>
                  <p className="text-[9px] text-white/30 truncate">{c.msg}</p>
                </div>
                {c.unread > 0 && (
                  <div className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                    {c.unread}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* chat area */}
          <div className="flex-1 flex flex-col bg-[#0d0d1a]">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-medium text-white/80">Empresa ABC</span>
              <div className="flex gap-1">
                <Badge className="bg-green-500/20 text-green-400 border-0 text-[9px] py-0">Ativo</Badge>
              </div>
            </div>
            <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-lg px-2 py-1 max-w-[70%]">
                  <p className="text-[10px] text-white/70">Preciso de ajuda com meu pedido #1234</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-green-500/30 rounded-lg px-2 py-1 max-w-[70%]">
                  <p className="text-[10px] text-white/80">Claro! Já estou verificando seu pedido...</p>
                </div>
              </div>
              {/* AI suggestion */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1.5">
                <p className="text-[9px] text-blue-400 font-medium mb-0.5">✦ Sugestão IA</p>
                <p className="text-[9px] text-white/60">Seu pedido #1234 está em separação e chega em 2 dias úteis. Posso ajudar com mais alguma coisa?</p>
              </div>
            </div>
          </div>

          {/* right panel */}
          <div className="w-36 border-l border-white/5 bg-[#0f0f1a] px-2 py-2 space-y-2">
            <p className="text-[9px] text-white/40 font-medium uppercase tracking-wide">Análise IA</p>
            <div className="bg-green-500/10 border border-green-500/20 rounded p-1.5">
              <p className="text-[9px] text-green-400 font-medium">Sentimento</p>
              <p className="text-[10px] text-green-300">😊 Positivo</p>
            </div>
            <div className="bg-white/5 rounded p-1.5">
              <p className="text-[9px] text-white/40 font-medium">Resumo</p>
              <p className="text-[9px] text-white/60">Cliente aguarda pedido #1234. Entrega em 2 dias.</p>
            </div>
            <div className="bg-white/5 rounded p-1.5">
              <p className="text-[9px] text-white/40 font-medium">Tópico</p>
              <Badge className="bg-orange-500/20 text-orange-400 border-0 text-[8px] py-0">Pedidos</Badge>
            </div>
          </div>
        </div>

        {/* bottom bar */}
        <div className="px-4 py-2 bg-[#12121e] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white/40">Atendimento Multi-Agente</span>
          </div>
          <span className="text-[10px] text-green-400 font-medium">● Ao vivo</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */

export default function Landing() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [defaultPlan, setDefaultPlan] = useState("equipe");

  const openCheckout = (planId = "equipe") => {
    setDefaultPlan(planId);
    setShowCheckout(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* ── NandiDev product family bar ──────────────────────────────────── */}
      <NandiProductBar />

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">NandiFlow</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs ml-1">Multi-Agente</Badge>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-white/70 hover:text-white text-sm">Entrar</Button>
            </Link>
            <Button
              onClick={() => openCheckout()}
              className="bg-green-500 hover:bg-green-600 text-white text-sm"
            >
              Contratar plano
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* left */}
          <div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-5">
              <Headphones className="w-3 h-3 mr-1.5" />
              Atendimento Multi-Agente
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
              CS, Suporte e Vendas{" "}
              <span className="text-green-400">num só lugar</span>
            </h1>
            <p className="text-white/60 text-lg mb-8 leading-relaxed">
              Plataforma de atendimento omnichannel com múltiplos agentes, sugestões de resposta por IA,
              análise de sentimento e resumos automáticos. Seu time atende mais rápido, com mais qualidade.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                "Caixa de entrada unificada multi-agente",
                "Sugestões de resposta com IA (Formal, Amigável, Direto)",
                "Análise de sentimento em tempo real",
                "Resumos automáticos de conversa",
                "Fila e triagem inteligente",
                "Tópicos e categorização automática",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => openCheckout()}
                className="bg-green-500 hover:bg-green-600 text-white px-8 h-12 text-base"
              >
                Quero melhorar meu atendimento
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <a href="#como-funciona">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 text-base">
                  <Play className="w-4 h-4 mr-2" />
                  Ver como funciona
                </Button>
              </a>
            </div>
          </div>

          {/* right — product mockup */}
          <ProductMockup />
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-green-400">{s.value}</p>
              <p className="text-sm text-white/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-white/60 border-white/10 mb-4">Como funciona</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Em 3 passos você está operando</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Do zero ao time completo atendendo com IA em menos de 10 minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-green-500/30 to-transparent -translate-y-px z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-green-400 font-bold text-sm">{step.num}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Funcionalidades ──────────────────────────────────────────────── */}
      <section id="funcionalidades" className="px-6 py-24 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-white/60 border-white/10 mb-4">Funcionalidades</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que seu time de atendimento precisa
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Uma plataforma completa para transformar o WhatsApp no canal de atendimento mais eficiente da sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 hover:border-green-500/30 transition-all group"
              >
                <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-500/30 transition-colors">
                  <f.icon className="w-4.5 h-4.5 text-green-400" />
                </div>
                <h3 className="font-semibold mb-1.5 text-sm">{f.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos ───────────────────────────────────────────────────────── */}
      <section id="planos" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-white/5 text-white/60 border-white/10 mb-4">Planos e Preços</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Escolha o plano ideal</h2>
            <p className="text-white/50 text-lg">
              Todos os planos incluem suporte, atualizações e infraestrutura gerenciada pela NandiDev.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border flex flex-col transition-all ${
                  plan.popular
                    ? "bg-green-500/10 border-green-500/50 shadow-xl shadow-green-500/10"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white border-0 px-3 shadow-lg">
                      <Star className="w-3 h-3 mr-1" /> Mais popular
                    </Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-white/40 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-green-400">
                      R${plan.price.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-white/40 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-1">
                    + R${plan.setup.toLocaleString("pt-BR")} de implementação
                  </p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {[plan.instances, plan.conversations, plan.members].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    IA e análise de sentimento
                  </li>
                  <li className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    Suporte e atualizações inclusas
                  </li>
                </ul>

                <Button
                  onClick={() => openCheckout(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Contratar {plan.name}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-white/30 text-sm mt-8">
            Precisa de um plano customizado?{" "}
            <a href="mailto:contato@nandidev.com.br" className="text-green-400 hover:underline">
              Fale com a NandiDev →
            </a>
          </p>
        </div>
      </section>

      {/* ── CTA Final ────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white/[0.02] border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Headphones className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seu atendimento?
          </h2>
          <p className="text-white/50 text-lg mb-8">
            Junte-se a equipes que já usam o NandiFlow para atender mais rápido e com mais qualidade no WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => openCheckout()}
              className="bg-green-500 hover:bg-green-600 text-white px-10 h-12 text-base"
            >
              Quero melhorar meu atendimento
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 text-base">
                Já tenho conta — Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold">NandiFlow</span>
            <span className="text-white/30 text-sm">· Desenvolvido pela NandiDev</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="mailto:contato@nandidev.com.br" className="hover:text-white/60 transition-colors">contato@nandidev.com.br</a>
            <Link to="/auth" className="hover:text-white/60 transition-colors">Acessar plataforma</Link>
          </div>
          <p className="text-white/30 text-sm">© 2026 NandiDev. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ── Checkout dialog ──────────────────────────────────────────────── */}
      <SubscriptionCheckoutDialog open={showCheckout} onOpenChange={setShowCheckout} defaultPlan={defaultPlan} />
    </div>
  );
}
