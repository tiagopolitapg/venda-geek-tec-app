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
import { Search, Plus, Pencil, Trash2, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { canCreate, canUpdate, canDelete } from "../components/utils/permissions";
import ProductForm from "../components/products/ProductForm";

export default function ProductsPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

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

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto cadastrado com sucesso!");
      setShowForm(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar produto: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto atualizado com sucesso!");
      setShowForm(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar produto: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Produto removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover produto: " + error.message);
    },
  });

  const handleSubmit = async (data) => {
    const password = prompt("Digite a senha para confirmar:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }

    // Verificar código único
    const existingProduct = products.find(
      p => p.code === data.code && p.id !== editingProduct?.id
    );
    
    if (existingProduct) {
      toast.error("Já existe um produto com este código!");
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product) => {
    const password = prompt("Digite a senha para editar:");
    if (password !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletePassword !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    deleteMutation.mutate(deletingProduct.id);
    setDeletingProduct(null);
    setDeletePassword("");
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterActive === "all" ||
      (filterActive === "active" && product.active) ||
      (filterActive === "inactive" && !product.active);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--navy)' }}>
              <Package className="h-8 w-8" />
              Produtos
            </h1>
            <p className="text-slate-600 mt-1">Gerencie o catálogo de produtos</p>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === "all" ? "default" : "outline"}
                  onClick={() => setFilterActive("all")}
                  className={filterActive === "all" ? "bg-gradient-to-r from-[#1e3a5f] to-[#10b981]" : ""}
                >
                  Todos
                </Button>
                <Button
                  variant={filterActive === "active" ? "default" : "outline"}
                  onClick={() => setFilterActive("active")}
                  className={filterActive === "active" ? "bg-green-600" : ""}
                >
                  Ativos
                </Button>
                <Button
                  variant={filterActive === "inactive" ? "default" : "outline"}
                  onClick={() => setFilterActive("inactive")}
                  className={filterActive === "inactive" ? "bg-red-600" : ""}
                >
                  Inativos
                </Button>
              </div>
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
                  Carregando produtos...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Nenhum produto encontrado
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{product.code}</p>
                        <p className="text-sm text-slate-600 truncate">{product.description}</p>
                      </div>
                      <Badge 
                        variant={product.active ? "default" : "secondary"}
                        className={product.active 
                          ? "bg-green-100 text-green-800 hover:bg-green-100 flex-shrink-0" 
                          : "bg-red-100 text-red-800 hover:bg-red-100 flex-shrink-0"
                        }
                      >
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Custo: R$ {product.cost?.toFixed(2)}</span>
                      <span className="font-semibold text-green-600">Venda: R$ {product.sale_price?.toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product)}
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
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold text-right">Custo</TableHead>
                    <TableHead className="font-semibold text-right">Preço de Venda</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Carregando produtos...
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{product.code}</TableCell>
                        <TableCell>{product.description}</TableCell>
                        <TableCell className="text-right">
                          R$ {product.cost?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold" style={{ color: 'var(--green)' }}>
                          R$ {product.sale_price?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={product.active ? "default" : "secondary"}
                            className={product.active 
                              ? "bg-green-100 text-green-800 hover:bg-green-100" 
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                            }
                          >
                            {product.active ? (
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
                              onClick={() => handleEdit(product)}
                              className="hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingProduct} onOpenChange={() => {
        setDeletingProduct(null);
        setDeletePassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir este produto?
            </p>
            {deletingProduct && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Código:</strong> {deletingProduct.code}</p>
                <p><strong>Descrição:</strong> {deletingProduct.description}</p>
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
                  setDeletingProduct(null);
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
                {deleteMutation.isPending ? "Excluindo..." : "Excluir Produto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}