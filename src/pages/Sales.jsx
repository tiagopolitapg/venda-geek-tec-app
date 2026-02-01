import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, ShoppingCart, Eye, Filter, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { canCreate } from "../components/utils/permissions";
import SaleForm from "../components/sales/SaleForm";
import SaleDetails from "../components/sales/SaleDetails";

export default function SalesPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [viewingSale, setViewingSale] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    minValue: "",
    maxValue: "",
    sellerId: "all"
  });

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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
    initialData: [],
  });

  const { data: sellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => base44.entities.Seller.list(),
    initialData: [],
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (saleId) => {
      const items = await base44.entities.SaleItem.filter({ sale_id: saleId });
      await Promise.all(items.map(item => base44.entities.SaleItem.delete(item.id)));
      await base44.entities.Sale.delete(saleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale_items'] });
      setDeletingSale(null);
      setDeletePassword("");
      toast.success("Venda excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir venda: " + error.message);
    },
  });

  const filteredSales = sales.filter(sale => {
    // Busca por nome ou CPF
    const matchesSearch = 
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client_cpf?.includes(searchTerm);
    
    // Filtro de data
    let matchesDate = true;
    if (filters.dateFrom) {
      const saleDate = new Date(sale.sale_date);
      const fromDate = new Date(filters.dateFrom);
      matchesDate = saleDate >= fromDate;
    }
    if (filters.dateTo && matchesDate) {
      const saleDate = new Date(sale.sale_date);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDate = saleDate <= toDate;
    }

    // Filtro de valor
    let matchesValue = true;
    if (filters.minValue) {
      matchesValue = sale.total >= parseFloat(filters.minValue);
    }
    if (filters.maxValue && matchesValue) {
      matchesValue = sale.total <= parseFloat(filters.maxValue);
    }

    // Filtro de vendedor
    const matchesSeller = 
      filters.sellerId === "all" || 
      sale.seller_id === filters.sellerId;
    
    return matchesSearch && matchesDate && matchesValue && matchesSeller;
  });

  const handleSaleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['sale_items'] });
    setShowForm(false);
    toast.success("Venda registrada com sucesso!");
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      minValue: "",
      maxValue: "",
      sellerId: "all"
    });
    setSearchTerm("");
  };

  const handleDeleteSale = () => {
    if (deletePassword !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    deleteSaleMutation.mutate(deletingSale.id);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--navy)' }}>
              <ShoppingCart className="h-8 w-8" />
              Vendas
            </h1>
            <p className="text-slate-600 mt-1">Gerencie suas vendas</p>
          </div>
          {canCreate(user, 'sales') && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou CPF do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Filtros Avançados</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Data Inicial</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data Final</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Valor Mínimo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.minValue}
                  onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Valor Máximo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Vendedor</Label>
                <Select value={filters.sellerId} onValueChange={(value) => setFilters({ ...filters, sellerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {sellers.map((seller) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="lg:hidden divide-y">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando vendas...
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Nenhuma venda encontrada
                </div>
              ) : (
                filteredSales.map((sale) => (
                  <div key={sale.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{sale.client_name}</p>
                        <p className="text-xs text-slate-500">CPF: {sale.client_cpf}</p>
                      </div>
                      <p className="font-bold text-green-600 flex-shrink-0">R$ {sale.total?.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{new Date(sale.sale_date).toLocaleString('pt-BR')}</span>
                      <span>{sale.seller_name || "-"}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingSale(sale)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingSale(sale)}
                        className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
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
                    <TableHead className="font-semibold">Data/Hora</TableHead>
                    <TableHead className="font-semibold">Cliente</TableHead>
                    <TableHead className="font-semibold">CPF</TableHead>
                    <TableHead className="font-semibold">Vendedor</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Carregando vendas...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          {new Date(sale.sale_date).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>{sale.client_name}</TableCell>
                        <TableCell>{sale.client_cpf}</TableCell>
                        <TableCell>
                          {sale.seller_name ? (
                            <span className="text-slate-700">{sale.seller_name}</span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold" style={{ color: 'var(--green)' }}>
                          R$ {sale.total?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setViewingSale(sale)}
                              className="hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingSale(sale)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Nova Venda</DialogTitle>
          </DialogHeader>
          <SaleForm
            onSuccess={handleSaleCreated}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {viewingSale && (
            <SaleDetails 
              sale={viewingSale}
              onClose={() => setViewingSale(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSale} onOpenChange={() => {
        setDeletingSale(null);
        setDeletePassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir esta venda?
            </p>
            {deletingSale && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Cliente:</strong> {deletingSale.client_name}</p>
                <p><strong>Total:</strong> R$ {deletingSale.total?.toFixed(2)}</p>
                <p><strong>Data:</strong> {new Date(deletingSale.sale_date).toLocaleString('pt-BR')}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Digite a senha para confirmar *</Label>
              <Input
                type="password"
                placeholder="Senha"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDeleteSale()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeletingSale(null);
                  setDeletePassword("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleDeleteSale}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteSaleMutation.isPending}
              >
                {deleteSaleMutation.isPending ? "Excluindo..." : "Excluir Venda"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}