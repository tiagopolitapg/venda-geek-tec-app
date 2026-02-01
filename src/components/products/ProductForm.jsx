import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function ProductForm({ product, onSubmit, onCancel }) {
  const generateCode = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatórios
    return `${year}${random}`;
  };

  const [formData, setFormData] = useState({
    code: product?.code || generateCode(),
    description: product?.description || "",
    cost: product?.cost || "",
    sale_price: product?.sale_price || "",
    active: product?.active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.code.trim()) {
      alert("O código é obrigatório!");
      return;
    }
    if (!formData.description.trim()) {
      alert("A descrição é obrigatória!");
      return;
    }
    if (!formData.cost || formData.cost < 0) {
      alert("O custo deve ser maior ou igual a zero!");
      return;
    }
    if (!formData.sale_price || formData.sale_price < 0) {
      alert("O preço de venda deve ser maior ou igual a zero!");
      return;
    }

    onSubmit({
      ...formData,
      description: formData.description.toUpperCase(),
      cost: parseFloat(formData.cost),
      sale_price: parseFloat(formData.sale_price),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Código *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ex: 20251234"
            required
            readOnly={!product}
            className={!product ? "bg-slate-100" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Ex: Produto de exemplo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Custo (R$) *</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale_price">Preço de Venda (R$) *</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
        />
        <Label htmlFor="active">Produto ativo</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
        >
          {product ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}