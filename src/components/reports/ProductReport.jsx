import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function ProductReport() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    productId: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

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

  // Filtrar vendas do período
  const filteredSales = sales.filter(sale => {
    if (!showResults) return false;

    const saleDate = new Date(sale.sale_date);
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);

    return saleDate >= fromDate && saleDate <= toDate;
  });

  const saleIds = filteredSales.map(sale => sale.id);

  // Filtrar itens das vendas do período
  const filteredItems = saleItems.filter(item => 
    saleIds.includes(item.sale_id) &&
    (filters.productId === "all" || item.product_id === filters.productId)
  );

  // Função para obter forma de pagamento mais usada
  const getMostUsedPayment = (paymentMethods) => {
    if (!paymentMethods || Object.keys(paymentMethods).length === 0) return "-";
    const mostUsed = Object.keys(paymentMethods).reduce((a, b) => 
      paymentMethods[a] > paymentMethods[b] ? a : b);
    
    const labels = {
      dinheiro: "💵 Dinheiro",
      pix: "📱 PIX",
      cartao_credito: "💳 Cartão",
      troca: "🔄 Troca"
    };
    return labels[mostUsed] || "-";
  };

  // Agrupar por produto
  const productStats = {};
  filteredItems.forEach(item => {
    const sale = filteredSales.find(s => s.id === item.sale_id);
    
    if (!productStats[item.product_id]) {
      const product = products.find(p => p.id === item.product_id);
      productStats[item.product_id] = {
        product_id: item.product_id,
        product_code: item.product_code,
        product_description: item.product_description,
        totalQuantity: 0,
        totalRevenue: 0,
        cost: product?.cost || 0,
        paymentMethods: {},
      };
    }
    productStats[item.product_id].totalQuantity += item.quantity;
    productStats[item.product_id].totalRevenue += item.total;
    
    if (sale?.payment_method) {
      const method = sale.payment_method;
      productStats[item.product_id].paymentMethods[method] = 
        (productStats[item.product_id].paymentMethods[method] || 0) + 1;
    }
  });

  let productArray = Object.values(productStats).map(product => ({
    ...product,
    avgPrice: product.totalRevenue / product.totalQuantity,
    grossMargin: product.totalRevenue - (product.cost * product.totalQuantity),
    grossMarginPercent: ((product.totalRevenue - (product.cost * product.totalQuantity)) / product.totalRevenue) * 100,
  }));

  // Ordenar por faturamento
  productArray.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Filtrar por busca
  productArray = productArray.filter(product =>
    product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuantity = productArray.reduce((sum, p) => sum + p.totalQuantity, 0);
  const totalRevenue = productArray.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalMargin = productArray.reduce((sum, p) => sum + p.grossMargin, 0);

  const exportToCSV = () => {
    const headers = ["Código", "Descrição", "Qtd Vendida", "Preço Médio (R$)", "Faturamento (R$)", "Margem Bruta (R$)", "Margem (%)"];
    const rows = productArray.map(product => [
      product.product_code,
      product.product_description,
      product.totalQuantity,
      product.avgPrice.toFixed(2),
      product.totalRevenue.toFixed(2),
      product.grossMargin.toFixed(2),
      product.grossMarginPercent.toFixed(2)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_por_produto_${filters.dateFrom}_${filters.dateTo}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Produto (Opcional)</Label>
              <Select value={filters.productId} onValueChange={(value) => setFilters({ ...filters, productId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.code} - {product.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleGenerate} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          <Card className="border-0 shadow-lg bg-gradient-to-r from-[#1e3a5f] to-[#10b981] text-white">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-90">Itens Vendidos</p>
                  <p className="text-3xl font-bold">{totalQuantity}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Faturamento Total</p>
                  <p className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Margem Bruta Total</p>
                  <p className="text-3xl font-bold">R$ {totalMargin.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <CardTitle>Ranking de Produtos</CardTitle>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" onClick={exportToCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="lg:hidden divide-y">
                {productArray.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Nenhum produto encontrado no período
                  </div>
                ) : (
                  productArray.map((product, index) => (
                    <div key={product.product_id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-slate-600">{index + 1}º</span>
                            <span className="font-medium text-slate-700">{product.product_code}</span>
                          </div>
                          <p className="text-sm text-slate-600">{product.product_description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Qtd Vendida</p>
                          <p className="font-semibold">{product.totalQuantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Preço Médio</p>
                          <p className="font-semibold">R$ {product.avgPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Faturamento</p>
                          <p className="font-semibold" style={{ color: 'var(--green)' }}>
                            R$ {product.totalRevenue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Margem</p>
                          <p className="font-semibold">
                            {product.grossMarginPercent.toFixed(1)}%
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Pagamento Principal</p>
                          <p className="text-sm">{getMostUsedPayment(product.paymentMethods)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd Vendida</TableHead>
                      <TableHead className="text-right">Preço Médio</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Margem Bruta</TableHead>
                      <TableHead className="text-right">Margem %</TableHead>
                      <TableHead>Pag. Principal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productArray.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          Nenhum produto encontrado no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      productArray.map((product, index) => (
                        <TableRow key={product.product_id}>
                          <TableCell className="font-bold text-slate-600">{index + 1}º</TableCell>
                          <TableCell className="font-medium">{product.product_code}</TableCell>
                          <TableCell>{product.product_description}</TableCell>
                          <TableCell className="text-right">{product.totalQuantity}</TableCell>
                          <TableCell className="text-right">R$ {product.avgPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: 'var(--green)' }}>
                            R$ {product.totalRevenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">R$ {product.grossMargin.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{product.grossMarginPercent.toFixed(1)}%</TableCell>
                          <TableCell>
                            <span className="text-sm">{getMostUsedPayment(product.paymentMethods)}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}