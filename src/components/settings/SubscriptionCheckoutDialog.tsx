import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const PLANS = [
  {
    id: 'conexao',
    name: 'Conexão',
    price: 197,
    instances: 1,
    conversations: '1.000',
    members: 3,
    setup: 997,
  },
  {
    id: 'equipe',
    name: 'Equipe',
    price: 497,
    instances: 5,
    conversations: '5.000',
    members: 10,
    setup: 1497,
    popular: true,
  },
  {
    id: 'escala',
    name: 'Escala',
    price: 997,
    instances: 20,
    conversations: '20.000',
    members: 30,
    setup: 2497,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionCheckoutDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<'plan' | 'payment' | 'done'>('plan');
  const [selectedPlan, setSelectedPlan] = useState('equipe');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    postalCode: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.cpfCnpj) {
      toast.error('Preencha nome, e-mail e CPF/CNPJ');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const { data, error } = await supabase.functions.invoke('create-asaas-subscription', {
        body: {
          plan: selectedPlan,
          name: form.name,
          email: form.email,
          cpfCnpj: form.cpfCnpj.replace(/\D/g, ''),
          phone: form.phone || undefined,
          postalCode: form.postalCode || undefined,
        },
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['org-subscription'] });
      setStep('done');
      toast.success('Assinatura criada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 'done') {
      setStep('plan');
      setForm({ name: '', email: '', cpfCnpj: '', phone: '', postalCode: '' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        {step === 'plan' && (
          <>
            <DialogHeader>
              <DialogTitle>Escolha seu Plano</DialogTitle>
              <DialogDescription>
                Selecione o plano ideal para sua operação
              </DialogDescription>
            </DialogHeader>

            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-3 mt-2">
              {PLANS.map(plan => (
                <label
                  key={plan.id}
                  htmlFor={`plan-${plan.id}`}
                  className={`flex items-start gap-4 border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{plan.name}</span>
                      {plan.popular && <Badge variant="default">Mais popular</Badge>}
                    </div>
                    <p className="text-2xl font-bold mt-1">
                      R$ {plan.price.toLocaleString('pt-BR')}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Implementação: R$ {plan.setup.toLocaleString('pt-BR')}
                    </p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{plan.instances} instância{plan.instances > 1 ? 's' : ''}</span>
                      <span>{plan.conversations} conversas/mês</span>
                      <span>{plan.members} membros</span>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={() => setStep('payment')}>Continuar</Button>
            </DialogFooter>
          </>
        )}

        {step === 'payment' && (
          <>
            <DialogHeader>
              <DialogTitle>Dados para faturamento</DialogTitle>
              <DialogDescription>
                Plano {PLANS.find(p => p.id === selectedPlan)?.name} — R${' '}
                {PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString('pt-BR')}/mês via boleto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Nome completo / Razão social *</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="João Silva ou Empresa Ltda"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="financeiro@empresa.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF ou CNPJ *</Label>
                  <Input
                    value={form.cpfCnpj}
                    onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input
                    value={form.postalCode}
                    onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                O boleto será gerado via Asaas e enviado para o e-mail informado. O serviço é ativado após confirmação do pagamento.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('plan')}>Voltar</Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar boleto
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Assinatura criada!
              </DialogTitle>
              <DialogDescription>
                O boleto foi gerado e enviado para o e-mail {form.email}. Seu serviço será ativado em até 1 dia útil após a confirmação do pagamento.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
