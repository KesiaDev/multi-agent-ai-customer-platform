import { Link } from "react-router-dom";
import { Bot, Users, BarChart3, Zap, MessageSquare, Shield, CheckCircle, ArrowRight, Star, TrendingUp, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Users,
    title: "Multi-Agentes",
    description: "Vários atendentes trabalhando na mesma conta WhatsApp simultaneamente.",
  },
  {
    icon: Bot,
    title: "IA Integrada",
    description: "Sugestões automáticas, composição de mensagens e análise com inteligência artificial.",
  },
  {
    icon: BarChart3,
    title: "Relatórios em Tempo Real",
    description: "Dashboard com métricas de atendimento, tempo de resposta e performance por agente.",
  },
  {
    icon: Zap,
    title: "Macros e Automações",
    description: "Respostas prontas, fluxos automáticos e atribuição inteligente de conversas.",
  },
  {
    icon: MessageSquare,
    title: "Gestão de Contatos",
    description: "CRM completo integrado ao WhatsApp com histórico e segmentação.",
  },
  {
    icon: TrendingUp,
    title: "Análise de Sentimento",
    description: "Entenda o humor dos seus clientes em tempo real com IA e priorize atendimentos.",
  },
];

const plans = [
  {
    id: "conexao",
    name: "Conexão",
    price: "R$197",
    period: "/mês",
    setup: "R$997 de implementação",
    description: "Ideal para pequenas operações",
    instances: "1 instância WhatsApp",
    conversations: "1.000 conversas/mês",
    members: "3 agentes",
    popular: false,
  },
  {
    id: "equipe",
    name: "Equipe",
    price: "R$497",
    period: "/mês",
    setup: "R$1.497 de implementação",
    description: "Para equipes em crescimento",
    instances: "5 instâncias WhatsApp",
    conversations: "5.000 conversas/mês",
    members: "10 agentes",
    popular: true,
  },
  {
    id: "escala",
    name: "Escala",
    price: "R$997",
    period: "/mês",
    setup: "R$2.497 de implementação",
    description: "Para operações de alto volume",
    instances: "20 instâncias WhatsApp",
    conversations: "20.000 conversas/mês",
    members: "30 agentes",
    popular: false,
  },
];

const stats = [
  { value: "98%", label: "de satisfação dos clientes" },
  { value: "3x", label: "mais rápido que atendimento manual" },
  { value: "24/7", label: "monitoramento e alertas" },
  { value: "< 2min", label: "tempo médio de primeira resposta" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">NandiFlow</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs ml-1">SaaS</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="text-white/70 hover:text-white">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-6">
            Plataforma Multi-Agente com IA
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Atendimento WhatsApp{" "}
            <span className="text-green-400">com múltiplos agentes</span>{" "}
            e inteligência artificial
          </h1>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Gerencie todas as conversas do WhatsApp da sua empresa em um único lugar.
            Múltiplos atendentes, IA integrada, relatórios em tempo real e automações poderosas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 h-12 text-base">
                Acessar a plataforma
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 h-12 text-base">
                Ver planos e preços
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-white/10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-green-400">{stat.value}</p>
              <p className="text-sm text-white/50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que sua equipe de atendimento precisa
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Uma plataforma completa para transformar o WhatsApp no canal de atendimento mais eficiente da sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 hover:border-green-500/30 transition-all"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="px-6 py-24 bg-white/2">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos e Preços</h2>
            <p className="text-white/50 text-lg">
              Todos os planos incluem suporte, atualizações e infraestrutura gerenciada pela NandiDev.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 border transition-all flex flex-col ${
                  plan.popular
                    ? "bg-green-500/10 border-green-500/50 shadow-lg shadow-green-500/10"
                    : "bg-white/5 border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white border-0 px-3">
                      <Star className="w-3 h-3 mr-1" /> Mais popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-white/40 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-green-400">{plan.price}</span>
                    <span className="text-white/40 mb-1">{plan.period}</span>
                  </div>
                  <p className="text-white/30 text-xs mt-1">{plan.setup}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
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

                <Link to="/auth">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    }`}
                  >
                    Começar com {plan.name}
                  </Button>
                </Link>
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

      {/* CTA Final */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Headphones className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar seu atendimento?
          </h2>
          <p className="text-white/50 text-lg mb-8">
            Acesse agora e veja como o NandiFlow pode mudar a forma como sua equipe atende no WhatsApp.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-10 h-12 text-base">
              Acessar a plataforma
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">NandiFlow</span>
            <span className="text-white/30 text-sm">· Desenvolvido pela NandiDev</span>
          </div>
          <p className="text-white/30 text-sm">
            © 2026 NandiDev. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
