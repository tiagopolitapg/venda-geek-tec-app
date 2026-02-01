import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function CashRegisterPage() {
  const [user, setUser] = useState(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [initialAmount, setInitialAmount] = useState("0");
  const [actualAmount, setActualAmount] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  const { data: cashRegisters, isLoading } = useQuery({
    queryKey: ['cashRegisters'],
    queryFn: () => base44.entities.CashRegister.list('-opening_date'),
    initialData: [],
  });

  const { data: todaySales } = useQuery({
    queryKey: ['todaySales', cashRegisters],
    queryFn: async () => {
      const openCash = cashRegisters.find(c => c.status === 'aberto');
      if (!openCash) return [];
      
      const allSales = await base44.entities.Sale.list('-sale_date');
      return allSales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const openDate = new Date(openCash.opening_date);
        return saleDate >= openDate;
      });
    },
    enabled: cashRegisters.length > 0,
    initialData: [],
  });

  const openMutation = useMutation({
    mutationFn: (data) => base44.entities.CashRegister.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegisters'] });
      toast.success("Caixa aberto com sucesso!");
      setShowOpenDialog(false);
      setInitialAmount("0");
    },
    onError: (error) => {
      toast.error("Erro ao abrir caixa: " + error.message);
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CashRegister.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashRegisters'] });
      toast.success("Caixa fechado com sucesso!");
      setShowCloseDialog(false);
      setActualAmount("");
      setNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao fechar caixa: " + error.message);
    },
  });

  const openCashRegister = cashRegisters.find(c => c.status === 'aberto');

  const calculateExpectedAmount = () => {
    if (!openCashRegister) return 0;
    
    const salesTotal = todaySales.reduce((sum, sale) => {
      const cashPayments = sale.payment_methods
        .filter(pm => pm.method === 'dinheiro')
        .reduce((pmSum, pm) => pmSum + pm.amount, 0);
      return sum + cashPayments;
    }, 0);
    
    return openCashRegister.initial_amount + salesTotal;
  };

  const handleOpenCash = () => {
    if (openCashRegister) {
      toast.error("Já existe um caixa aberto!");
      return;
    }

    const password = prompt("Digite a senha para abrir o caixa:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }

    openMutation.mutate({
      opening_date: new Date().toISOString(),
      initial_amount: parseFloat(initialAmount) || 0,
      expected_amount: parseFloat(initialAmount) || 0,
      status: "aberto",
      opened_by: user?.email || "Desconhecido",
    });
  };

  const handleCloseCash = () => {
    if (!actualAmount) {
      toast.error("Informe o valor real contado!");
      return;
    }

    const password = prompt("Digite a senha para fechar o caixa:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }

    const expected = calculateExpectedAmount();
    const actual = parseFloat(actualAmount);
    const difference = actual - expected;

    closeMutation.mutate({
      id: openCashRegister.id,
      data: {
        closing_date: new Date().toISOString(),
        expected_amount: expected,
        actual_amount: actual,
        difference: difference,
        status: "fechado",
        closed_by: user?.email || "Desconhecido",
        notes: notes || undefined,
      },
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--navy)' }}>
              <Wallet className="h-8 w-8" />
              Controle de Caixa
            </h1>
            <p className="text-slate-600 mt-1">Gerencie a abertura e fechamento do caixa</p>
          </div>
          <Button
            onClick={() => setShowOpenDialog(true)}
            disabled={!!openCashRegister}
            className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        </div>

        {/* Caixa Atual */}
        {openCashRegister && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Caixa Aberto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-900">
                  {new Date(openCashRegister.opening_date).toLocaleString('pt-BR')}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Por: {openCashRegister.opened_by}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">Valor Inicial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                  {formatCurrency(openCashRegister.initial_amount)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-600">Vendas em Dinheiro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                  {formatCurrency(calculateExpectedAmount() - openCashRegister.initial_amount)}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {todaySales.length} venda(s)
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg md:col-span-3 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold text-blue-900">
                  Valor Esperado no Caixa
                </CardTitle>
                <Button
                  onClick={() => setShowCloseDialog(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90"
                >
                  Fechar Caixa
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-900">
                  {formatCurrency(calculateExpectedAmount())}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Inicial: {formatCurrency(openCashRegister.initial_amount)} + 
                  Vendas: {formatCurrency(calculateExpectedAmount() - openCashRegister.initial_amount)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!openCashRegister && (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <Wallet className="h-16 w-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                Nenhum caixa aberto
              </h3>
              <p className="text-slate-500 mb-6">
                Abra o caixa para começar a registrar vendas
              </p>
              <Button
                onClick={() => setShowOpenDialog(true)}
                className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Caixas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="lg:hidden divide-y">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando...
                </div>
              ) : cashRegisters.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Nenhum registro encontrado
                </div>
              ) : (
                cashRegisters.map((cash) => (
                  <div key={cash.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Abertura</p>
                        <p className="font-semibold text-sm">{new Date(cash.opening_date).toLocaleString('pt-BR')}</p>
                        {cash.closing_date && (
                          <>
                            <p className="text-xs text-slate-500 mt-1">Fechamento</p>
                            <p className="text-sm">{new Date(cash.closing_date).toLocaleString('pt-BR')}</p>
                          </>
                        )}
                      </div>
                      <Badge 
                        variant={cash.status === "aberto" ? "default" : "secondary"}
                        className={cash.status === "aberto"
                          ? "bg-green-100 text-green-800 flex-shrink-0"
                          : cash.difference != null && cash.difference === 0
                          ? "bg-blue-100 text-blue-800 flex-shrink-0"
                          : cash.difference != null && cash.difference !== 0
                          ? "bg-yellow-100 text-yellow-800 flex-shrink-0"
                          : "bg-slate-100 text-slate-800 flex-shrink-0"
                        }
                      >
                        {cash.status === "aberto" ? "Aberto" : cash.difference === 0 ? "OK" : "Diferença"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Inicial</p>
                        <p className="font-semibold">{formatCurrency(cash.initial_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Esperado</p>
                        <p className="font-semibold">{formatCurrency(cash.expected_amount)}</p>
                      </div>
                      {cash.actual_amount != null && (
                        <>
                          <div>
                            <p className="text-xs text-slate-500">Real</p>
                            <p className="font-semibold">{formatCurrency(cash.actual_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Diferença</p>
                            <p className={`font-semibold ${cash.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {cash.difference >= 0 ? '+' : ''}{formatCurrency(cash.difference)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Data Abertura</TableHead>
                    <TableHead>Data Fechamento</TableHead>
                    <TableHead className="text-right">Inicial</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : cashRegisters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    cashRegisters.map((cash) => (
                      <TableRow key={cash.id} className="hover:bg-slate-50">
                        <TableCell>
                          {new Date(cash.opening_date).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {cash.closing_date 
                            ? new Date(cash.closing_date).toLocaleString('pt-BR')
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cash.initial_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(cash.expected_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cash.actual_amount != null 
                            ? formatCurrency(cash.actual_amount)
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {cash.difference != null ? (
                            <span className={cash.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {cash.difference >= 0 ? (
                                <TrendingUp className="inline h-4 w-4 mr-1" />
                              ) : (
                                <TrendingDown className="inline h-4 w-4 mr-1" />
                              )}
                              {formatCurrency(Math.abs(cash.difference))}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={cash.status === "aberto" ? "default" : "secondary"}
                            className={cash.status === "aberto"
                              ? "bg-green-100 text-green-800"
                              : cash.difference != null && cash.difference === 0
                              ? "bg-blue-100 text-blue-800"
                              : cash.difference != null && cash.difference !== 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-slate-100 text-slate-800"
                            }
                          >
                            {cash.status === "aberto" ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aberto
                              </>
                            ) : cash.difference === 0 ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fechado OK
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Fechado c/ Diferença
                              </>
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abrir Caixa Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Inicial (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowOpenDialog(false);
                  setInitialAmount("0");
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleOpenCash}
                className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]"
              >
                Abrir Caixa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Valor Esperado:</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(calculateExpectedAmount())}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Valor Real Contado (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {actualAmount && (
              <div className={`p-4 rounded-lg ${
                parseFloat(actualAmount) === calculateExpectedAmount()
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Diferença:</span>
                  <span className={`text-lg font-bold ${
                    parseFloat(actualAmount) >= calculateExpectedAmount()
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {parseFloat(actualAmount) >= calculateExpectedAmount() ? '+' : ''}
                    {formatCurrency(parseFloat(actualAmount) - calculateExpectedAmount())}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Digite observações sobre o fechamento (opcional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCloseDialog(false);
                  setActualAmount("");
                  setNotes("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCloseCash}
                className="bg-red-600 hover:bg-red-700"
              >
                Fechar Caixa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}