import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Banknote, Smartphone, CreditCard, RefreshCw } from "lucide-react";

export default function PaymentReport() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const [showResults, setShowResults] = useState(false);

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
    initialData: [],
    enabled: showResults,
  });

  const handleGenerate = () => {
    if (!filters.dateFrom || !filters.dateTo) {
      alert("Selecione o período completo!");
      return;
    }
    setShowResults(true);
  };

  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    return saleDate >= fromDate && saleDate <= toDate;
  });

  // Agregar por forma de pagamento
  const paymentStats = {
    dinheiro: { count: 0, total: 0 },
    pix: { count: 0, total: 0 },
    cartao_credito: { count: 0, total: 0, a_vista: 0, parcelado: 0 },
    troca: { count: 0, total: 0 },
  };

  filteredSales.forEach(sale => {
    if (sale.payment_methods && Array.isArray(sale.payment_methods)) {
      sale.payment_methods.forEach(pm => {
        const method = pm.method;
        if (paymentStats[method]) {
          paymentStats[method].count++;
          paymentStats[method].total += pm.amount || 0;
          
          if (method === "cartao_credito") {
            if (pm.payment_type === "a_vista") {
              paymentStats[method].a_vista++;
            } else if (pm.payment_type === "parcelado") {
              paymentStats[method].parcelado++;
            }
          }
        }
      });
    }
  });

  const totalVendas = filteredSales.length;
  const totalValor = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  const paymentMethods = [
    {
      key: "dinheiro",
      name: "Dinheiro",
      icon: Banknote,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      key: "pix",
      name: "PIX",
      icon: Smartphone,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      key: "cartao_credito",
      name: "Cartão de Crédito",
      icon: CreditCard,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      key: "troca",
      name: "Troca",
      icon: RefreshCw,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--navy)' }}>
            <DollarSign className="h-8 w-8" />
            Relatório de Formas de Pagamento
          </h1>
          <p className="text-slate-600">Análise por método de pagamento</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Data Inicial *</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final *</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
            <Button 
              onClick={handleGenerate}
              className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total de Vendas</p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--navy)' }}>
                        {totalVendas}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Valor Total</p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--green)' }}>
                        R$ {totalValor.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => {
                const stats = paymentStats[method.key];
                const percentage = totalVendas > 0 ? ((stats.count / totalVendas) * 100).toFixed(1) : 0;
                const Icon = method.icon;

                return (
                  <Card key={method.key} className="border-0 shadow-lg overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${method.color}`} />
                    <CardHeader className={method.bgColor}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${method.color}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <CardTitle className={`text-xl ${method.textColor}`}>
                            {method.name}
                          </CardTitle>
                        </div>
                        <div className={`text-2xl font-bold ${method.textColor}`}>
                          {percentage}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Quantidade</span>
                          <span className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                            {stats.count}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Valor Total</span>
                          <span className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                            R$ {stats.total.toFixed(2)}
                          </span>
                        </div>
                        {method.key === "cartao_credito" && stats.count > 0 && (
                          <div className="pt-4 border-t border-slate-200">
                            <div className="grid grid-cols-2 gap-4 text-center">
                              <div>
                                <p className="text-xs text-slate-500 mb-1">À Vista</p>
                                <p className="text-lg font-semibold text-purple-700">
                                  {stats.a_vista}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 mb-1">Parcelado</p>
                                <p className="text-lg font-semibold text-purple-700">
                                  {stats.parcelado}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}