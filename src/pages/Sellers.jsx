import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Plus, Pencil, Trash2, UserCheck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { canCreate, canUpdate, canDelete } from "../components/utils/permissions";
import SellerForm from "../components/sellers/SellerForm";

export default function SellersPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [deletingSeller, setDeletingSeller] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

  const queryClient = useQueryClient();

  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      setUser({
        full_name: authUser.name,
        email: authUser.email,
        role: authUser.role
      });
    }
  }, [authUser]);

  const { data: sellers, isLoading } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => base44.entities.Seller.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Seller.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success("Vendedor cadastrado com sucesso!");
      setShowForm(false);
      setEditingSeller(null);
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar vendedor: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Seller.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success("Vendedor atualizado com sucesso!");
      setShowForm(false);
      setEditingSeller(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar vendedor: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Seller.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      toast.success("Vendedor removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover vendedor: " + error.message);
    },
  });

  const handleSubmit = async (data) => {
    const password = prompt("Digite a senha para confirmar:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }

    if (editingSeller) {
      updateMutation.mutate({ id: editingSeller.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (seller) => {
    const password = prompt("Digite a senha para editar:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    
    setEditingSeller(seller);
    setShowForm(true);
  };

  const handleDelete = (seller) => {
    setDeletingSeller(seller);
  };

  const confirmDelete = () => {
    if (deletePassword !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    deleteMutation.mutate(deletingSeller.id);
    setDeletingSeller(null);
    setDeletePassword("");
  };

  const filteredSellers = sellers.filter(seller => {
    return seller.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--navy)' }}>
              <UserCheck className="h-8 w-8" />
              Vendedores
            </h1>
            <p className="text-slate-600 mt-1">Gerencie sua equipe de vendas</p>
          </div>
          <Button
            onClick={() => {
              const password = prompt("Digite a senha para criar vendedor:");
              if (password !== "2244") {
                toast.error("Senha incorreta!");
                return;
              }
              setEditingSeller(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Vendedor
          </Button>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {/* Mobile View */}
            <div className="lg:hidden divide-y">
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">
                  Carregando vendedores...
                </div>
              ) : filteredSellers.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Nenhum vendedor encontrado
                </div>
              ) : (
                filteredSellers.map((seller) => (
                  <div key={seller.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{seller.name}</p>
                        <p className="text-sm text-slate-600">{seller.phone}</p>
                      </div>
                      <Badge 
                        variant={seller.active ? "default" : "secondary"}
                        className={seller.active 
                          ? "bg-green-100 text-green-800 hover:bg-green-100 flex-shrink-0" 
                          : "bg-red-100 text-red-800 hover:bg-red-100 flex-shrink-0"
                        }
                      >
                        {seller.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(seller)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(seller)}
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
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Celular</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Carregando vendedores...
                      </TableCell>
                    </TableRow>
                  ) : filteredSellers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Nenhum vendedor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSellers.map((seller) => (
                      <TableRow key={seller.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell>{seller.phone}</TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={seller.active ? "default" : "secondary"}
                            className={seller.active 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                            }
                          >
                            {seller.active ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(seller)}
                              className="hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(seller)}
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>
              {editingSeller ? "Editar Vendedor" : "Novo Vendedor"}
            </DialogTitle>
          </DialogHeader>
          <SellerForm
            seller={editingSeller}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingSeller(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSeller} onOpenChange={() => {
        setDeletingSeller(null);
        setDeletePassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir este vendedor?
            </p>
            {deletingSeller && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Nome:</strong> {deletingSeller.name}</p>
                <p><strong>Celular:</strong> {deletingSeller.phone}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Digite a senha para confirmar *</Label>
              <Input
                type="password"
                placeholder="Senha"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmDelete()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeletingSeller(null);
                  setDeletePassword("");
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Excluindo..." : "Excluir Vendedor"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}