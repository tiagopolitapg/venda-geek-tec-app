import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { maskPhone } from "../utils/cpfValidator";

export default function SellerForm({ seller, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: seller?.name || "",
    phone: seller?.phone || "",
    active: seller?.active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("O nome é obrigatório!");
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 15) {
      alert("O celular é obrigatório e deve estar completo!");
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: João da Silva"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Celular *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            maxLength={15}
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
        <Label htmlFor="active">Vendedor ativo</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
        >
          {seller ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}