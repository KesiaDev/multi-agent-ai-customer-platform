import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgBilling } from "@/hooks/useOrgBilling";
import { SubscriptionCheckoutDialog } from "./SubscriptionCheckoutDialog";
import { Building2, CreditCard, MessageSquare, Bot, Zap, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_LABELS: Record<string, string> = {
  conexao:    'Conexão',
  equipe:     'Equipe',
  escala:     'Escala',
  enterprise: 'Enterprise',
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trial:     { label: 'Trial',     variant: 'secondary' },
  active:    { label: 'Ativo',     variant: 'default' },
  overdue:   { label: 'Vencido',   variant: 'destructive' },
  suspended: { label: 'Suspenso',  variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
};

function UsageBar({ label, used, total, icon: Icon }: {
  label: string;
  used: number;
  total: number;
  icon: React.ElementType;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-orange-500' : 'bg-primary';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-medium tabular-nums">
          {used.toLocaleString('pt-BR')} / {total.toLocaleString('pt-BR')}
          <span className="text-muted-foreground ml-1">({pct}%)</span>
        </span>
      </div>
      <Progress value={pct} className="h-2" indicatorClassName={color} />
    </div>
  );
}

export function OrgBillingPanel() {
  const { organization } = useAuth();
  const { subscription, planQuota, currentUsage, isLoading } = useOrgBilling();
  const [showCheckout, setShowCheckout] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const plan = subscription?.plan ?? organization?.plan ?? 'conexao';
  const status = subscription?.status ?? 'trial';
  const planLabel = PLAN_LABELS[plan] ?? plan;
  const statusInfo = STATUS_LABELS[status] ?? { label: status, variant: 'outline' as const };

  return (
    <div className="space-y-6">
      {/* Org & Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organização
          </CardTitle>
          <CardDescription>Dados da sua conta e plano contratado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{organization?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plano atual</p>
              <p className="font-medium flex items-center gap-2">
                {planLabel}
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </p>
            </div>

            {planQuota && (
              <div>
                <p className="text-muted-foreground">Preço</p>
                <p className="font-medium">
                  R$ {planQuota.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                </p>
              </div>
            )}

            {subscription?.next_due_date && (
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Próximo vencimento
                </p>
                <p className="font-medium">
                  {format(new Date(subscription.next_due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}

            {subscription?.trial_ends_at && status === 'trial' && (
              <div>
                <p className="text-muted-foreground">Trial até</p>
                <p className="font-medium">
                  {format(new Date(subscription.trial_ends_at), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage vs Quota */}
      {planQuota && currentUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Uso este mês
            </CardTitle>
            <CardDescription>
              Consumo do período atual vs. limites do Plano {planLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <UsageBar
              label="Mensagens / Conversas"
              used={currentUsage.messages_count}
              total={planQuota.max_conversations_per_month}
              icon={MessageSquare}
            />
            <UsageBar
              label="Chamadas de IA"
              used={currentUsage.ai_calls_count}
              total={planQuota.max_conversations_per_month * 3}
              icon={Bot}
            />

            <div className="pt-2 border-t grid grid-cols-3 gap-4 text-sm text-center">
              <div>
                <p className="text-muted-foreground">Instâncias</p>
                <p className="font-semibold text-lg">{planQuota.max_instances}</p>
                <p className="text-xs text-muted-foreground">limite</p>
              </div>
              <div>
                <p className="text-muted-foreground">Membros</p>
                <p className="font-semibold text-lg">{planQuota.max_members}</p>
                <p className="text-xs text-muted-foreground">limite</p>
              </div>
              <div>
                <p className="text-muted-foreground">Plano</p>
                <p className="font-semibold text-lg">{planLabel}</p>
                <p className="text-xs text-muted-foreground">atual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA for trial/overdue */}
      {(status === 'trial' || status === 'overdue') && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {status === 'trial' ? 'Você está no período de trial' : 'Pagamento pendente'}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {status === 'trial'
                    ? 'Ative sua assinatura para garantir continuidade do serviço após o trial.'
                    : 'Regularize seu pagamento para evitar suspensão do serviço.'}
                </p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => setShowCheckout(true)}
                >
                  {status === 'trial' ? 'Ativar assinatura' : 'Regularizar pagamento'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <SubscriptionCheckoutDialog open={showCheckout} onOpenChange={setShowCheckout} />
    </div>
  );
}
