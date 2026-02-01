import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileDown } from "lucide-react";
import { toast } from "sonner";

export default function PeriodReport() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    clientId: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
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
    const matchesClient = filters.clientId === "all" || sale.client_id === filters.clientId;
    const matchesSearch = 
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client_cpf?.includes(searchTerm);

    return matchesDate && matchesClient && matchesSearch;
  });

  const salesWithItems = filteredSales.map(sale => {
    const items = saleItems.filter(item => item.sale_id === sale.id);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return { ...sale, totalItems };
  });

  const totalValue = salesWithItems.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalItemsCount = salesWithItems.reduce((sum, sale) => sum + sale.totalItems, 0);

  const exportToCSV = () => {
    const headers = ["Data", "Cliente", "CPF", "Qtd Itens", "Total (R$)"];
    const rows = salesWithItems.map(sale => [
      new Date(sale.sale_date).toLocaleString('pt-BR'),
      sale.client_name,
      sale.client_cpf,
      sale.totalItems,
      sale.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_por_periodo_${filters.dateFrom}_${filters.dateTo}.csv`);
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
              <Label>Cliente (Opcional)</Label>
              <Select value={filters.clientId} onValueChange={(value) => setFilters({ ...filters, clientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.cpf}
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
                  <p className="text-sm opacity-90">Total de Vendas</p>
                  <p className="text-3xl font-bold">R$ {totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Quantidade de Vendas</p>
                  <p className="text-3xl font-bold">{salesWithItems.length}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Total de Itens Vendidos</p>
                  <p className="text-3xl font-bold">{totalItemsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Vendas do Período</CardTitle>
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
                    Exportar CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="lg:hidden divide-y">
                {salesWithItems.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Nenhuma venda encontrada no período
                  </div>
                ) : (
                  salesWithItems.map((sale) => (
                    <div key={sale.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{sale.client_name}</p>
                          <p className="text-xs text-slate-500">{sale.client_cpf}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{ color: 'var(--green)' }}>
                            R$ {sale.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Data</p>
                          <p className="font-medium">{new Date(sale.sale_date).toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Qtd Itens</p>
                          <p className="font-semibold">{sale.totalItems}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Pagamento</p>
                          <p className="text-sm">
                            {sale.payment_method === "dinheiro" && "💵 Dinheiro"}
                            {sale.payment_method === "pix" && "📱 PIX"}
                            {sale.payment_method === "cartao_credito" && `💳 Cartão${sale.payment_type === "parcelado" ? ` ${sale.installments}x` : ""}`}
                            {sale.payment_method === "troca" && "🔄 Troca"}
                            {!sale.payment_method && "-"}
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
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Qtd Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesWithItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Nenhuma venda encontrada no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesWithItems.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{new Date(sale.sale_date).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{sale.client_name}</TableCell>
                          <TableCell>{sale.client_cpf}</TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {sale.payment_method === "dinheiro" && "💵 Dinheiro"}
                              {sale.payment_method === "pix" && "📱 PIX"}
                              {sale.payment_method === "cartao_credito" && `💳 Cartão${sale.payment_type === "parcelado" ? ` ${sale.installments}x` : ""}`}
                              {sale.payment_method === "troca" && "🔄 Troca"}
                              {!sale.payment_method && "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{sale.totalItems}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: 'var(--green)' }}>
                            R$ {sale.total.toFixed(2)}
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