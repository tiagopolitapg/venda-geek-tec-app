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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { canCreate, canUpdate, canDelete } from "../components/utils/permissions";
import { removeMask } from "../components/utils/cpfValidator";
import ClientForm from "../components/clients/ClientForm";

export default function ClientsPage() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deletingClient, setDeletingClient] = useState(null);
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

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente cadastrado com sucesso!");
      setShowForm(false);
      setEditingClient(null);
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente atualizado com sucesso!");
      setShowForm(false);
      setEditingClient(null);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover cliente: " + error.message);
    },
  });

  const handleSubmit = async (data) => {
    // Verificar CPF duplicado
    const existingClient = clients.find(
      c => c.cpf === data.cpf && c.id !== editingClient?.id
    );
    
    if (existingClient) {
      toast.error("Já existe um cliente cadastrado com este CPF!");
      return;
    }

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (client) => {
    if (!canUpdate(user, 'clients')) {
      toast.error("Você não tem permissão para editar clientes");
      return;
    }
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client) => {
    if (!canDelete(user, 'clients')) {
      toast.error("Você não tem permissão para excluir clientes");
      return;
    }
    setDeletingClient(client);
  };

  const confirmDelete = () => {
    if (deletePassword !== "2244") {
      toast.error("Senha incorreta!");
      return;
    }
    deleteMutation.mutate(deletingClient.id);
    setDeletingClient(null);
    setDeletePassword("");
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const searchOnlyNumbers = removeMask(searchTerm);
    
    // Busca por nome
    const matchName = client.name?.toLowerCase().includes(searchLower);
    
    // Busca por CPF (com ou sem máscara)
    const clientCpfNumbers = removeMask(client.cpf || "");
    const matchCpf = clientCpfNumbers.includes(searchOnlyNumbers) || 
                     client.cpf?.includes(searchTerm);
    
    return matchName || matchCpf;
  });

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--navy)' }}>
              <Users className="h-8 w-8" />
              Clientes
            </h1>
            <p className="text-slate-600 mt-1">Gerencie seus clientes</p>
          </div>
          {canCreate(user, 'clients') && (
            <Button
              onClick={() => {
                setEditingClient(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">CPF</TableHead>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Celular</TableHead>
                    <TableHead className="font-semibold">Data Nasc.</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Carregando clientes...
                      </TableCell>
                    </TableRow>
                  ) : filteredClients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{client.cpf}</TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>{client.birth_date}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canUpdate(user, 'clients') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(client)}
                                className="hover:bg-blue-100 hover:text-blue-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete(user, 'clients') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(client)}
                                className="hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
              {editingClient ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingClient} onOpenChange={() => {
        setDeletingClient(null);
        setDeletePassword("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--navy)' }}>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir este cliente?
            </p>
            {deletingClient && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Nome:</strong> {deletingClient.name}</p>
                <p><strong>CPF:</strong> {deletingClient.cpf}</p>
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
                  setDeletingClient(null);
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
                {deleteMutation.isPending ? "Excluindo..." : "Excluir Cliente"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}