import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileDown, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

export default function SellerReport() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    sellerId: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: sellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => base44.entities.Seller.list(),
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

  const filteredSales = sales.filter(sale => {
    if (!showResults) return false;

    const saleDate = new Date(sale.sale_date);
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);

    const matchesDate = saleDate >= fromDate && saleDate <= toDate;
    const matchesSeller = filters.sellerId === "all" || sale.seller_id === filters.sellerId;

    return matchesDate && matchesSeller;
  });

  // Agrupar por vendedor
  const sellerStats = {};
  filteredSales.forEach(sale => {
    const sellerId = sale.seller_id || "no_seller";
    const sellerName = sale.seller_name || "Sem vendedor";

    if (!sellerStats[sellerId]) {
      sellerStats[sellerId] = {
        seller_id: sellerId,
        seller_name: sellerName,
        salesCount: 0,
        totalValue: 0,
        totalItems: 0,
        clients: new Set(),
      };
    }
    sellerStats[sellerId].salesCount++;
    sellerStats[sellerId].totalValue += sale.total || 0;
    sellerStats[sellerId].clients.add(sale.client_id);

    const items = saleItems.filter(item => item.sale_id === sale.id);
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    sellerStats[sellerId].totalItems += itemsCount;
  });

  let sellerArray = Object.values(sellerStats).map(seller => ({
    ...seller,
    clientCount: seller.clients.size,
    avgTicket: seller.totalValue / seller.salesCount,
  }));

  // Ordenar por valor total
  sellerArray.sort((a, b) => b.totalValue - a.totalValue);

  // Filtrar por busca
  sellerArray = sellerArray.filter(seller =>
    seller.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = sellerArray.reduce((sum, seller) => sum + seller.totalValue, 0);
  const totalSales = sellerArray.reduce((sum, seller) => sum + seller.salesCount, 0);
  const avgTicketGeral = totalSales > 0 ? totalValue / totalSales : 0;
  const totalSellers = sellerArray.filter(s => s.seller_id !== "no_seller").length;

  const exportToCSV = () => {
    const headers = ["Posição", "Vendedor", "Qtd Vendas", "Qtd Clientes", "Total Itens", "Valor Total (R$)", "Ticket Médio (R$)"];
    const rows = sellerArray.map((seller, index) => [
      index + 1,
      seller.seller_name,
      seller.salesCount,
      seller.clientCount,
      seller.totalItems,
      seller.totalValue.toFixed(2),
      seller.avgTicket.toFixed(2)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_vendedores_${filters.dateFrom}_${filters.dateTo}.csv`);
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
              <Label>Vendedor (Opcional)</Label>
              <Select value={filters.sellerId} onValueChange={(value) => setFilters({ ...filters, sellerId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vendedores</SelectItem>
                  {sellers.filter(s => s.active).map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleGenerate} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
              Gerar Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <p className="text-sm opacity-90">Faturamento Total</p>
                <p className="text-3xl font-bold">R$ {totalValue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <p className="text-sm opacity-90">Total de Vendas</p>
                <p className="text-3xl font-bold">{totalSales}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <p className="text-sm opacity-90">Vendedores Ativos</p>
                <p className="text-3xl font-bold">{totalSellers}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="pt-6">
                <p className="text-sm opacity-90">Ticket Médio Geral</p>
                <p className="text-3xl font-bold">R$ {avgTicketGeral.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {sellerArray.length > 0 && sellerArray[0].seller_id !== "no_seller" && (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6" />
                  <div>
                    <CardTitle className="text-xl">Vendedor Destaque do Período</CardTitle>
                    <p className="text-sm opacity-90 mt-1">{sellerArray[0].seller_name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Vendas</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                      {sellerArray[0].salesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Clientes</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                      {sellerArray[0].clientCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Faturamento</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>
                      R$ {sellerArray[0].totalValue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Ticket Médio</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                      R$ {sellerArray[0].avgTicket.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <CardTitle>Ranking de Vendedores</CardTitle>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar vendedor..."
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
                {sellerArray.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Nenhum vendedor encontrado no período
                  </div>
                ) : (
                  sellerArray.map((seller, index) => (
                    <div key={seller.seller_id} className={`p-4 space-y-3 ${seller.seller_id === "no_seller" ? "bg-slate-50" : ""}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                          index === 0 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-slate-200'
                        }`}>
                          <span className={`font-bold ${index < 3 && seller.seller_id !== "no_seller" ? 'text-white' : 'text-slate-600'}`}>
                            {index + 1}º
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold text-base ${seller.seller_id === "no_seller" ? "text-slate-500 italic" : "text-slate-800"}`}>
                            {seller.seller_name}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Vendas</p>
                          <p className="font-semibold">{seller.salesCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Clientes</p>
                          <p className="font-semibold">{seller.clientCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Itens</p>
                          <p className="font-semibold">{seller.totalItems}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ticket Médio</p>
                          <p className="font-semibold">R$ {seller.avgTicket.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Faturamento Total</p>
                          <p className="font-semibold text-lg" style={{ color: 'var(--green)' }}>
                            R$ {seller.totalValue.toFixed(2)}
                          </p>
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
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Clientes</TableHead>
                      <TableHead className="text-right">Total Itens</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerArray.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Nenhum vendedor encontrado no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      sellerArray.map((seller, index) => (
                        <TableRow key={seller.seller_id} className={seller.seller_id === "no_seller" ? "bg-slate-50" : ""}>
                          <TableCell>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                              index === 0 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                              index === 1 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              index === 2 && seller.seller_id !== "no_seller" ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-slate-200'
                            }`}>
                              <span className={`font-bold text-sm ${index < 3 && seller.seller_id !== "no_seller" ? 'text-white' : 'text-slate-600'}`}>
                                {index + 1}º
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={seller.seller_id === "no_seller" ? "text-slate-500 italic" : "font-semibold"}>
                            {seller.seller_name}
                          </TableCell>
                          <TableCell className="text-right">{seller.salesCount}</TableCell>
                          <TableCell className="text-right">{seller.clientCount}</TableCell>
                          <TableCell className="text-right">{seller.totalItems}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: 'var(--green)' }}>
                            R$ {seller.totalValue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {seller.avgTicket.toFixed(2)}
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