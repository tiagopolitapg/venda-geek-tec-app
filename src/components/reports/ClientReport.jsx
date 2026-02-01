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

export default function ClientReport() {
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

    return matchesDate && matchesClient;
  });

  // Função para obter forma de pagamento mais usada
  const getMostUsedPayment = (clientSales) => {
    const paymentCount = {};
    clientSales.forEach(sale => {
      const method = sale.payment_method;
      if (method) {
        paymentCount[method] = (paymentCount[method] || 0) + 1;
      }
    });
    
    if (Object.keys(paymentCount).length === 0) return "-";
    
    const mostUsed = Object.keys(paymentCount).reduce((a, b) => 
      paymentCount[a] > paymentCount[b] ? a : b);
    
    const labels = {
      dinheiro: "💵 Dinheiro",
      pix: "📱 PIX",
      cartao_credito: "💳 Cartão",
      troca: "🔄 Troca"
    };
    return labels[mostUsed] || "-";
  };

  // Agrupar por cliente
  const clientStats = {};
  filteredSales.forEach(sale => {
    if (!clientStats[sale.client_id]) {
      clientStats[sale.client_id] = {
        client_id: sale.client_id,
        client_name: sale.client_name,
        client_cpf: sale.client_cpf,
        salesCount: 0,
        totalValue: 0,
        totalItems: 0,
        sales: [],
      };
    }
    clientStats[sale.client_id].salesCount++;
    clientStats[sale.client_id].totalValue += sale.total || 0;
    clientStats[sale.client_id].sales.push(sale);

    const items = saleItems.filter(item => item.sale_id === sale.id);
    const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
    clientStats[sale.client_id].totalItems += itemsCount;
  });

  let clientArray = Object.values(clientStats).map(client => ({
    ...client,
    avgTicket: client.totalValue / client.salesCount,
  }));

  // Ordenar por valor total
  clientArray.sort((a, b) => b.totalValue - a.totalValue);

  // Filtrar por busca
  clientArray = clientArray.filter(client =>
    client.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_cpf?.includes(searchTerm)
  );

  const totalValue = clientArray.reduce((sum, client) => sum + client.totalValue, 0);
  const totalSales = clientArray.reduce((sum, client) => sum + client.salesCount, 0);
  const avgTicketGeral = totalSales > 0 ? totalValue / totalSales : 0;

  const exportToCSV = () => {
    const headers = ["Cliente", "CPF", "Qtd Vendas", "Total Itens", "Valor Total (R$)", "Ticket Médio (R$)"];
    const rows = clientArray.map(client => [
      client.client_name,
      client.client_cpf,
      client.salesCount,
      client.totalItems,
      client.totalValue.toFixed(2),
      client.avgTicket.toFixed(2)
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vendas_por_cliente_${filters.dateFrom}_${filters.dateTo}.csv`);
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm opacity-90">Total Geral (R$)</p>
                  <p className="text-3xl font-bold">R$ {totalValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Vendas</p>
                  <p className="text-3xl font-bold">{totalSales}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Clientes</p>
                  <p className="text-3xl font-bold">{clientArray.length}</p>
                </div>
                <div>
                  <p className="text-sm opacity-90">Ticket Médio Geral</p>
                  <p className="text-3xl font-bold">R$ {avgTicketGeral.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <CardTitle>Ranking de Clientes</CardTitle>
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
                {clientArray.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    Nenhum cliente encontrado no período
                  </div>
                ) : (
                  clientArray.map((client, index) => (
                    <div key={client.client_id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-200 flex-shrink-0">
                          <span className="font-bold text-slate-600">{index + 1}º</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{client.client_name}</p>
                          <p className="text-xs text-slate-500">{client.client_cpf}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Vendas</p>
                          <p className="font-semibold">{client.salesCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Total Itens</p>
                          <p className="font-semibold">{client.totalItems}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Pag. Principal</p>
                          <p className="text-sm">{getMostUsedPayment(client.sales)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ticket Médio</p>
                          <p className="font-semibold">R$ {client.avgTicket.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Valor Total</p>
                          <p className="font-bold text-lg" style={{ color: 'var(--green)' }}>
                            R$ {client.totalValue.toFixed(2)}
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
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Total Itens</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Pag. Principal</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientArray.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                          Nenhum cliente encontrado no período
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientArray.map((client, index) => (
                        <TableRow key={client.client_id}>
                          <TableCell className="font-bold text-slate-600">{index + 1}º</TableCell>
                          <TableCell className="font-semibold">{client.client_name}</TableCell>
                          <TableCell>{client.client_cpf}</TableCell>
                          <TableCell className="text-right">{client.salesCount}</TableCell>
                          <TableCell className="text-right">{client.totalItems}</TableCell>
                          <TableCell className="text-right font-bold" style={{ color: 'var(--green)' }}>
                            R$ {client.totalValue.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getMostUsedPayment(client.sales)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {client.avgTicket.toFixed(2)}
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