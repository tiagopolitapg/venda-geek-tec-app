import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function SummaryReport() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
  });
  const [showResults, setShowResults] = useState(false);

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
    initialData: [],
    enabled: showResults,
  });

  const { data: saleItems } = useQuery({
    queryKey: ['saleItems'],
    queryFn: () => base44.entities.SaleItem.list(),
    initialData: [],
    enabled: showResults,
  });

  const handleGenerate = () => {
    if (!filters.dateFrom || !filters.dateTo) {
      toast.error("Preencha as datas inicial e final!");
      return;
    }
    setShowResults(true);
  };

  const filteredSales = sales.filter(sale => {
    if (!showResults) return false;

    const saleDate = new Date(sale.sale_date);
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);

    return saleDate >= fromDate && saleDate <= toDate;
  });

  const saleIds = filteredSales.map(sale => sale.id);
  const filteredItems = saleItems.filter(item => saleIds.includes(item.sale_id));

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalSales = filteredSales.length;
  const totalItems = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  // Top 5 produtos
  const productStats = {};
  filteredItems.forEach(item => {
    if (!productStats[item.product_id]) {
      productStats[item.product_id] = {
        product_code: item.product_code,
        product_description: item.product_description,
        totalRevenue: 0,
        totalQuantity: 0,
      };
    }
    productStats[item.product_id].totalRevenue += item.total;
    productStats[item.product_id].totalQuantity += item.quantity;
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const indicators = [
    {
      title: "Faturamento Total",
      value: `R$ ${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Quantidade de Vendas",
      value: totalSales,
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Total de Itens Vendidos",
      value: totalItems,
      icon: Package,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${avgTicket.toFixed(2)}`,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Selecione o Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="mt-4">
            <Button onClick={handleGenerate} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
              Gerar Resumo
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {indicators.map((indicator, index) => (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${indicator.color} opacity-5`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {indicator.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${indicator.color}`}>
                    <indicator.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>
                    {indicator.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {topProducts.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${
                          index === 0 ? 'from-yellow-400 to-yellow-600' :
                          index === 1 ? 'from-gray-300 to-gray-500' :
                          index === 2 ? 'from-orange-400 to-orange-600' :
                          'from-slate-300 to-slate-500'
                        }`}>
                          <span className="text-white font-bold">{index + 1}º</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{product.product_description}</p>
                          <p className="text-sm text-slate-500">Código: {product.product_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: 'var(--green)' }}>
                          R$ {product.totalRevenue.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">{product.totalQuantity} unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}