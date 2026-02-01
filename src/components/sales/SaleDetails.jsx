import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer } from "lucide-react";

export default function SaleDetails({ sale, onClose }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['sale_items', sale.id],
    queryFn: () => base44.entities.SaleItem.filter({ sale_id: sale.id }),
    initialData: [],
  });

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handlePrint = () => {
    const paymentLabels = {
      dinheiro: "Dinheiro",
      pix: "PIX",
      cartao_credito: "Cartão Crédito",
      troca: "Troca"
    };

    const width = 48;
    const padCenter = (text) => {
      const pad = Math.max(0, width - text.length);
      const left = Math.floor(pad / 2);
      return ' '.repeat(left) + text;
    };
    const padLine = (label, value) => {
      const available = width - label.length;
      return label + value.padStart(available);
    };
    const padRight = (text, w) => text.slice(0, w).padEnd(w);
    const padLeft = (text, w) => text.slice(0, w).padStart(w);

    let receipt = '';
    receipt += padCenter('GEEK TEC STORE') + '\n';
    receipt += padCenter('METROPOLIS COM. DO VEST. LTDA') + '\n';
    receipt += padCenter('CNPJ: 37.412.512/0001-75') + '\n';
    receipt += padCenter('AV. VICTOR FERREIRA DO AMARAL 2633') + '\n';
    receipt += padCenter('LOJA 1038 JOCKEY PLAZA SHOPPING') + '\n';
    receipt += '='.repeat(width) + '\n\n';
    
    receipt += padCenter(`CUPOM N: ${sale.code}`) + '\n\n';
    receipt += padLine('Data/Hora: ', new Date(sale.sale_date).toLocaleString('pt-BR')) + '\n';
    receipt += padLine('Cliente: ', sale.client_name) + '\n';
    receipt += padLine('CPF: ', sale.client_cpf) + '\n';
    if (sale.seller_name) {
      receipt += padLine('Vendedor: ', sale.seller_name) + '\n';
    }
    receipt += '-'.repeat(width) + '\n';
    receipt += '# Codigo    Descricao           Qtd   Unit.  Total\n';
    receipt += '-'.repeat(width) + '\n';
    
    items.forEach((item, index) => {
      const num = String(index + 1).padStart(2, '0');
      const code = padRight(item.product_code || '', 10);
      const desc = item.product_description || '';
      receipt += `${num} ${code} ${desc}\n`;
      const qty = padLeft(String(item.quantity), 4);
      const unit = padLeft(item.unit_price?.toFixed(2) || '0.00', 8);
      const total = padLeft(item.total?.toFixed(2) || '0.00', 8);
      receipt += `   UN  X ${unit}           ${qty}  ${total}\n`;
    });
    
    receipt += '-'.repeat(width) + '\n';
    receipt += padLine('QTD. TOTAL DE ITENS', String(items.length).padStart(3, '0')) + '\n';
    
    if (sale.discount > 0) {
      receipt += padLine('SUBTOTAL R$', calculateSubtotal().toFixed(2)) + '\n';
      receipt += padLine('DESCONTO R$', '-' + sale.discount.toFixed(2)) + '\n';
    }
    
    receipt += padLine('VALOR TOTAL R$', (sale.total?.toFixed(2) || '0.00')) + '\n';
    receipt += '-'.repeat(width) + '\n';
    receipt += padLine('FORMA DE PAGAMENTO', 'Valor Pago') + '\n';
    
    sale.payment_methods?.forEach((pm) => {
      let label = paymentLabels[pm.method] || pm.method;
      if (pm.method === 'cartao_credito' && pm.payment_type === 'parcelado') {
        label += ` ${pm.installments}x`;
      }
      receipt += padLine(label, (pm.amount?.toFixed(2) || '0.00')) + '\n';
    });
    
    receipt += '='.repeat(width) + '\n';
    receipt += padCenter('Obrigado pela preferencia!') + '\n';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={handlePrint}
          className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
          disabled={isLoading}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Cupom
        </Button>
      </div>

      <Card className="border-0">
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg">Informações da Venda</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Data/Hora</p>
              <p className="font-semibold">{new Date(sale.sale_date).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="font-semibold">{sale.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">CPF</p>
              <p className="font-semibold">{sale.client_cpf}</p>
            </div>
            {sale.seller_name && (
              <div>
                <p className="text-sm text-slate-500">Vendedor</p>
                <p className="font-semibold">{sale.seller_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Forma(s) de Pagamento</p>
              <div className="space-y-1 mt-1">
                {sale.payment_methods?.map((pm, index) => {
                  const labels = {
                    dinheiro: "💵 Dinheiro",
                    pix: "📱 PIX",
                    cartao_credito: "💳 Cartão",
                    troca: "🔄 Troca"
                  };
                  return (
                    <div key={index} className="text-sm">
                      <p className="font-semibold">{labels[pm.method]}: R$ {pm.amount?.toFixed(2)}</p>
                      {pm.method === "cartao_credito" && pm.payment_type && (
                        <p className="text-xs text-slate-600 ml-6">
                          {pm.payment_type === "a_vista" ? "À Vista" : `Parcelado em ${pm.installments}x`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total da Venda</p>
              {sale.discount > 0 && !isLoading && (
                <p className="text-xs text-slate-500 mb-1">
                  Subtotal: R$ {calculateSubtotal().toFixed(2)}
                  <span className="text-red-600 ml-2">Desconto: - R$ {sale.discount.toFixed(2)}</span>
                </p>
              )}
              <p className="font-bold text-xl" style={{ color: 'var(--green)' }}>
                R$ {sale.total?.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0">
        <CardHeader className="bg-slate-50">
          <CardTitle className="text-lg">Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_code}</TableCell>
                    <TableCell>{item.product_description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">R$ {item.unit_price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {item.total?.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {sale.discount > 0 && (
                  <>
                    <TableRow className="border-t-2">
                      <TableCell colSpan={4} className="text-right font-semibold">
                        Subtotal:
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R$ {calculateSubtotal().toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-semibold text-red-600">
                        Desconto:
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        - R$ {sale.discount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2 bg-slate-50">
                      <TableCell colSpan={4} className="text-right font-bold text-lg">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg" style={{ color: 'var(--green)' }}>
                        R$ {sale.total?.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}