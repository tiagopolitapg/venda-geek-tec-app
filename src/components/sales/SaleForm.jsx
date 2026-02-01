import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Plus, Trash2, UserPlus, Banknote, Smartphone, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ClientForm from "../clients/ClientForm";

export default function SaleForm({ onSuccess, onCancel }) {
  const [step, setStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: 1,
    unit_price: "",
    size: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [discount, setDiscount] = useState(0);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ active: true }),
    initialData: [],
  });

  const { data: sellers } = useQuery({
    queryKey: ['sellers'],
    queryFn: () => base44.entities.Seller.filter({ active: true }),
    initialData: [],
  });

  const formatCPFForForm = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length !== 11) return "";
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleClientSelect = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
    setClientSearch("");
  };

  const filteredClients = clients.filter(client => {
    const searchLower = clientSearch.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.cpf?.includes(searchLower)
    );
  });

  const handleNewClientSubmit = async (data) => {
    try {
      const newClient = await base44.entities.Client.create(data);
      setSelectedClient(newClient);
      setShowNewClientForm(false);
      toast.success("Cliente cadastrado e vinculado à venda!");
    } catch (error) {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    }
  };

  const handleProductSelect = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setCurrentItem({
        ...currentItem,
        product_id: productId,
        unit_price: product.sale_price,
        size: "",
      });
      setProductSearch("");
    }
  };

  const isCamiseta = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.description?.toLowerCase().includes("camiseta");
  };

  const sizes = ["8", "10", "12", "14", "16", "PP", "P", "M", "G", "GG", "XG"];

  const filteredProducts = products.filter(product => {
    const searchLower = productSearch.toLowerCase();
    return (
      product.code?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.sale_price?.toString().includes(searchLower)
    );
  });

  const handleAddItem = () => {
    if (!currentItem.product_id) {
      toast.error("Selecione um produto!");
      return;
    }
    if (!currentItem.quantity || currentItem.quantity < 1) {
      toast.error("A quantidade deve ser maior que zero!");
      return;
    }
    if (!currentItem.unit_price || currentItem.unit_price < 0) {
      toast.error("O preço unitário deve ser maior ou igual a zero!");
      return;
    }
    if (isCamiseta(currentItem.product_id) && !currentItem.size) {
      toast.error("Selecione o tamanho da camiseta!");
      return;
    }

    const product = products.find(p => p.id === currentItem.product_id);
    const total = parseFloat(currentItem.quantity) * parseFloat(currentItem.unit_price);
    const descriptionWithSize = isCamiseta(currentItem.product_id) 
      ? `${product.description} - Tam: ${currentItem.size}`
      : product.description;

    setItems([
      ...items,
      {
        ...currentItem,
        product_code: product.code,
        product_description: descriptionWithSize,
        quantity: parseFloat(currentItem.quantity),
        unit_price: parseFloat(currentItem.unit_price),
        total,
      },
    ]);

    setCurrentItem({
      product_id: "",
      quantity: 1,
      unit_price: "",
      size: "",
    });
    setProductSearch("");
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountValue = parseFloat(discount) || 0;
    return Math.max(0, subtotal - discountValue);
  };

  const printReceipt = (sale, saleItems) => {
    const width = 48;
    
    const padCenter = (text) => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const padLine = (left, right) => {
      const spaces = width - left.length - right.length;
      return left + ' '.repeat(Math.max(1, spaces)) + right;
    };

    const paymentMethodLabels = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_credito: 'Cartão de Crédito',
      troca: 'Troca'
    };

    let receipt = '';
    receipt += padCenter('GEEK TEC STORE') + '\n';
    receipt += padCenter('METROPOLIS COM. DO VEST. LTDA') + '\n';
    receipt += padCenter('CNPJ: 37.412.512/0001-75') + '\n';
    receipt += padCenter('AV. VICTOR FERREIRA DO AMARAL 2633') + '\n';
    receipt += padCenter('LOJA 1038 JOCKEY PLAZA SHOPPING') + '\n';
    receipt += '='.repeat(width) + '\n\n';
    
    receipt += padCenter(`CUPOM N: ${sale.code}`) + '\n\n';
    receipt += padLine('Data:', new Date(sale.sale_date).toLocaleString('pt-BR')) + '\n';
    receipt += padLine('Cliente:', sale.client_name) + '\n';
    receipt += padLine('CPF:', sale.client_cpf) + '\n';
    if (sale.seller_name) {
      receipt += padLine('Vendedor:', sale.seller_name) + '\n';
    }
    receipt += '\n' + '-'.repeat(width) + '\n';
    receipt += 'ITENS\n';
    receipt += '-'.repeat(width) + '\n';
    
    saleItems.forEach(item => {
      receipt += `${item.product_code} - ${item.product_description}\n`;
      receipt += padLine(
        `  ${item.quantity} x R$ ${item.unit_price.toFixed(2)}`,
        `R$ ${item.total.toFixed(2)}`
      ) + '\n';
    });
    
    receipt += '-'.repeat(width) + '\n';
    receipt += padLine('Subtotal:', `R$ ${calculateSubtotal().toFixed(2)}`) + '\n';
    
    if (sale.discount > 0) {
      receipt += padLine('Desconto:', `- R$ ${sale.discount.toFixed(2)}`) + '\n';
    }
    
    receipt += '='.repeat(width) + '\n';
    receipt += padLine('TOTAL:', `R$ ${sale.total.toFixed(2)}`) + '\n';
    receipt += '='.repeat(width) + '\n\n';
    
    receipt += 'FORMAS DE PAGAMENTO:\n';
    sale.payment_methods.forEach(pm => {
      let label = paymentMethodLabels[pm.method] || pm.method;
      if (pm.method === 'cartao_credito') {
        if (pm.payment_type === 'parcelado') {
          label += ` (${pm.installments}x)`;
        } else {
          label += ' (à vista)';
        }
      }
      receipt += padLine(`  ${label}:`, `R$ ${pm.amount.toFixed(2)}`) + '\n';
    });
    
    receipt += '\n' + '='.repeat(width) + '\n';
    receipt += padCenter('Obrigado pela preferencia!') + '\n';
    receipt += '='.repeat(width) + '\n';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cupom de Venda</title>
          <style>
            @media print {
              @page { 
                margin: 0;
                size: 80mm auto;
              }
              body { 
                margin: 0;
                padding: 5mm;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Courier New', 'Courier', monospace;
              font-size: 14px;
              font-weight: 600;
              line-height: 1.4;
              white-space: pre;
              margin: 0;
              padding: 10px;
              color: #000;
              background: #fff;
            }
          </style>
        </head>
        <body>${receipt}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error("Selecione um cliente!");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione pelo menos um item à venda!");
      return;
    }
    if (paymentMethods.length === 0) {
      toast.error("Selecione pelo menos uma forma de pagamento!");
      return;
    }
    
    const totalPayments = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const saleTotal = calculateTotal();
    
    if (Math.abs(totalPayments - saleTotal) > 0.01) {
      toast.error(`O valor total dos pagamentos (R$ ${totalPayments.toFixed(2)}) deve ser igual ao total da venda (R$ ${saleTotal.toFixed(2)})!`);
      return;
    }
    
    for (const pm of paymentMethods) {
      if (pm.method === "cartao_credito" && !pm.payment_type) {
        toast.error("Informe se o pagamento no cartão é à vista ou parcelado!");
        return;
      }
    }

    try {
      // Gerar código sequencial no formato ANOMESXXXXXX
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}${month}`;
      
      // Buscar última venda do mês para obter o próximo número sequencial
      const salesThisMonth = await base44.entities.Sale.filter({});
      const salesWithSamePrefix = salesThisMonth
        .filter(s => s.code?.startsWith(prefix))
        .map(s => parseInt(s.code.slice(prefix.length)) || 0);
      
      const nextSequence = salesWithSamePrefix.length > 0 
        ? Math.max(...salesWithSamePrefix) + 1 
        : 1;
      
      const code = `${prefix}${String(nextSequence).padStart(6, '0')}`;

      const discountValue = parseFloat(discount) || 0;
      const saleData = {
        code,
        sale_date: new Date().toISOString(),
        client_id: selectedClient.id,
        client_name: selectedClient.name,
        client_cpf: selectedClient.cpf,
        discount: discountValue,
        total: calculateTotal(),
        payment_methods: paymentMethods.map(pm => ({
          method: pm.method,
          amount: parseFloat(pm.amount),
          ...(pm.payment_type && { payment_type: pm.payment_type }),
          ...(pm.installments && { installments: pm.installments }),
        })),
      };

      if (selectedSeller) {
        saleData.seller_id = selectedSeller.id;
        saleData.seller_name = selectedSeller.name;
      }

      const sale = await base44.entities.Sale.create(saleData);

      for (const item of items) {
        await base44.entities.SaleItem.create({
          sale_id: sale.id,
          product_id: item.product_id,
          product_code: item.product_code,
          product_description: item.product_description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        });
      }

      // Perguntar se deseja imprimir o cupom
      const shouldPrint = window.confirm("Venda registrada com sucesso!\n\nDeseja imprimir o cupom?");

      if (shouldPrint) {
        printReceipt(sale, items);
      }

      onSuccess();
    } catch (error) {
      toast.error("Erro ao registrar venda: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= s
                ? "bg-gradient-to-r from-[#1e3a5f] to-[#10b981] text-white"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Cliente */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecione o Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewClientForm ? (
                <>
                  <div className="space-y-2">
                    <Label>Buscar Cliente (por nome ou CPF)</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Digite o nome ou CPF do cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {clientSearch && filteredClients.length > 0 && (
                    <Card className="max-h-60 overflow-y-auto border border-slate-200">
                      <CardContent className="p-0">
                        <div className="divide-y">
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => handleClientSelect(client.id)}
                              className="w-full px-4 py-3 hover:bg-slate-50 text-left transition-colors"
                            >
                              <p className="font-semibold text-sm">{client.name}</p>
                              <p className="text-sm text-slate-600">CPF: {client.cpf}</p>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedClient && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-800">
                        Cliente Selecionado: {selectedClient.name} - {selectedClient.cpf}
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewClientForm(true);
                    }}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Cadastrar novo cliente
                  </Button>
                </>
              ) : (
                <div>
                  <h3 className="font-semibold mb-4">Cadastrar Novo Cliente</h3>
                  <ClientForm
                    client={{ cpf: formatCPFForForm(clientSearch) }}
                    onSubmit={handleNewClientSubmit}
                    onCancel={() => setShowNewClientForm(false)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Vendedor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecione o Vendedor *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {sellers.map((seller) => (
                  <Button
                    key={seller.id}
                    variant={selectedSeller?.id === seller.id ? "default" : "outline"}
                    onClick={() => setSelectedSeller(seller)}
                    className={selectedSeller?.id === seller.id 
                      ? "bg-gradient-to-r from-[#1e3a5f] to-[#10b981]" 
                      : ""
                    }
                  >
                    {seller.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedClient && selectedSeller && !showNewClientForm && (
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
                Próximo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Itens */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Itens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Produto (por código, descrição ou preço)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Digite para buscar..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {productSearch && filteredProducts.length > 0 && (
                <Card className="max-h-60 overflow-y-auto border border-slate-200">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleProductSelect(product.id)}
                          className="w-full px-4 py-3 hover:bg-slate-50 text-left transition-colors flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-sm">{product.code}</p>
                            <p className="text-sm text-slate-600">{product.description}</p>
                          </div>
                          <p className="font-bold text-green-600">R$ {product.sale_price?.toFixed(2)}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentItem.product_id && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-800">
                    Produto Selecionado: {products.find(p => p.id === currentItem.product_id)?.description}
                  </p>
                </div>
              )}

              {currentItem.product_id && isCamiseta(currentItem.product_id) && (
                <div className="space-y-2">
                  <Label>Tamanho *</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={currentItem.size === size ? "default" : "outline"}
                        onClick={() => setCurrentItem({ ...currentItem, size })}
                        className={currentItem.size === size 
                          ? "bg-gradient-to-r from-[#1e3a5f] to-[#10b981] min-w-[48px]" 
                          : "min-w-[48px]"
                        }
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preço Unit. (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleAddItem} className="w-full" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Itens Adicionados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_code}</TableCell>
                        <TableCell>{item.product_description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">R$ {item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {item.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <span className="font-bold text-lg">Total da Venda:</span>
                  <span className="font-bold text-2xl" style={{ color: 'var(--green)' }}>
                    R$ {calculateTotal().toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button onClick={() => setStep(1)} variant="outline">
              Voltar
            </Button>
            {items.length > 0 && (
              <Button onClick={() => setStep(3)} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
                Próximo
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Resumo */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2">Cliente</h4>
                <p className="text-sm">Nome: {selectedClient.name}</p>
                <p className="text-sm">CPF: {selectedClient.cpf}</p>
              </div>

              {selectedSeller && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Vendedor</h4>
                  <p className="text-sm">{selectedSeller.name}</p>
                </div>
              )}

              <div className="p-4 bg-white border-2 border-slate-200 rounded-lg">
                <h4 className="font-semibold mb-4">Formas de Pagamento *</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {["dinheiro", "pix", "cartao_credito", "troca"].map((method) => {
                    const isSelected = paymentMethods.some(pm => pm.method === method);
                    const icons = {
                      dinheiro: { icon: Banknote, color: "green", label: "Dinheiro" },
                      pix: { icon: Smartphone, color: "blue", label: "PIX" },
                      cartao_credito: { icon: CreditCard, color: "purple", label: "Cartão" },
                      troca: { icon: RefreshCw, color: "orange", label: "Troca" }
                    };
                    const { icon: Icon, color, label } = icons[method];
                    
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPaymentMethods(paymentMethods.filter(pm => pm.method !== method));
                          } else {
                            const amount = paymentMethods.length === 0 ? calculateTotal() : 0;
                            setPaymentMethods([...paymentMethods, { 
                              method, 
                              amount,
                              ...(method === "cartao_credito" && { payment_type: "a_vista", installments: 1 })
                            }]);
                          }
                        }}
                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? `border-${color}-500 bg-${color}-50`
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? `text-${color}-600` : "text-slate-600"}`} />
                        <span className={`text-sm font-medium ${isSelected ? `text-${color}-700` : "text-slate-700"}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {paymentMethods.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    {paymentMethods.map((pm, index) => {
                      const icons = {
                        dinheiro: { label: "Dinheiro", icon: "💵" },
                        pix: { label: "PIX", icon: "📱" },
                        cartao_credito: { label: "Cartão", icon: "💳" },
                        troca: { label: "Troca", icon: "🔄" }
                      };
                      
                      return (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{icons[pm.method].icon} {icons[pm.method].label}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setPaymentMethods(paymentMethods.filter((_, i) => i !== index))}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {paymentMethods.length > 1 && (
                            <div className="space-y-2">
                              <Label>Valor (R$) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={pm.amount || ""}
                                onChange={(e) => {
                                  const newPayments = [...paymentMethods];
                                  const newValue = parseFloat(e.target.value) || 0;
                                  newPayments[index].amount = e.target.value;
                                  
                                  const saleTotal = calculateTotal();
                                  const remaining = saleTotal - newValue;
                                  
                                  // Se há outras formas de pagamento, distribuir o restante
                                  const otherPayments = newPayments.filter((_, i) => i !== index);
                                  if (otherPayments.length === 1) {
                                    // Se só tem uma outra forma, coloca todo o restante nela
                                    const otherIndex = newPayments.findIndex((_, i) => i !== index);
                                    newPayments[otherIndex].amount = Math.max(0, remaining).toFixed(2);
                                  } else if (otherPayments.length > 1) {
                                    // Se tem mais de uma, distribui igualmente entre as outras
                                    const otherIndices = newPayments.map((_, i) => i).filter(i => i !== index);
                                    const valuePerOther = Math.max(0, remaining / otherIndices.length);
                                    otherIndices.forEach(i => {
                                      newPayments[i].amount = valuePerOther.toFixed(2);
                                    });
                                  }
                                  
                                  setPaymentMethods(newPayments);
                                }}
                                placeholder="0.00"
                              />
                            </div>
                          )}

                          {pm.method === "cartao_credito" && (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPayments = [...paymentMethods];
                                    newPayments[index].payment_type = "a_vista";
                                    newPayments[index].installments = 1;
                                    setPaymentMethods(newPayments);
                                  }}
                                  className={`flex-1 p-2 rounded-lg border-2 text-sm transition-all ${
                                    pm.payment_type === "a_vista"
                                      ? "border-purple-500 bg-purple-50 text-purple-700"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  À Vista
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPayments = [...paymentMethods];
                                    newPayments[index].payment_type = "parcelado";
                                    newPayments[index].installments = 2;
                                    setPaymentMethods(newPayments);
                                  }}
                                  className={`flex-1 p-2 rounded-lg border-2 text-sm transition-all ${
                                    pm.payment_type === "parcelado"
                                      ? "border-purple-500 bg-purple-50 text-purple-700"
                                      : "border-slate-200 hover:border-slate-300"
                                  }`}
                                >
                                  Parcelado
                                </button>
                              </div>

                              {pm.payment_type === "parcelado" && (
                                <div className="space-y-2">
                                  <Label>Número de Parcelas</Label>
                                  <Select 
                                    value={(pm.installments || 2).toString()} 
                                    onValueChange={(value) => {
                                      const newPayments = [...paymentMethods];
                                      newPayments[index].installments = parseInt(value);
                                      setPaymentMethods(newPayments);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[...Array(10)].map((_, i) => {
                                        const parcelas = i + 1;
                                        const valor = pm.amount || calculateTotal();
                                        const valorParcela = (valor / parcelas).toFixed(2);
                                        return (
                                          <SelectItem key={parcelas} value={parcelas.toString()}>
                                            {parcelas}x de R$ {valorParcela}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {paymentMethods.length > 1 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">Total dos Pagamentos:</span>
                          <span className="font-bold">
                            R$ {paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="font-semibold">Total da Venda:</span>
                          <span className="font-bold">R$ {calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2">Itens ({items.length})</h4>
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span>{item.product_description} x {item.quantity}</span>
                    <span>R$ {item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-2 border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Subtotal:</span>
                  <span className="font-semibold">R$ {calculateSubtotal().toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={calculateSubtotal()}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {parseFloat(discount) > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Desconto:</span>
                    <span>- R$ {parseFloat(discount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gradient-to-r from-[#1e3a5f] to-[#10b981] text-white rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">TOTAL</span>
                  <span className="font-bold text-3xl">R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button onClick={() => setStep(2)} variant="outline">
              Voltar
            </Button>
            <div className="flex gap-2">
              <Button onClick={onCancel} variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981]">
                Finalizar Venda
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}