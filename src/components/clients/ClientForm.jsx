import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateCPF, maskCPF, maskPhone, removeMask } from "../utils/cpfValidator";

export default function ClientForm({ client, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    cpf: client?.cpf || "",
    name: client?.name || "",
    phone: client?.phone || "",
    birth_date: client?.birth_date || "",
  });

  const maskBirthDate = (value) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  };

  const [cpfError, setCpfError] = useState("");

  const handleCPFChange = (value) => {
    const masked = maskCPF(value);
    setFormData({ ...formData, cpf: masked });
    
    // Validar apenas quando tiver 14 caracteres (CPF completo com máscara)
    if (masked.length === 14) {
      if (!validateCPF(masked)) {
        setCpfError("CPF inválido!");
      } else {
        setCpfError("");
      }
    } else {
      setCpfError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.cpf.trim() || formData.cpf.length !== 14) {
      alert("O CPF é obrigatório e deve estar completo!");
      return;
    }

    if (!validateCPF(formData.cpf)) {
      alert("CPF inválido! Verifique os números digitados.");
      return;
    }

    if (!formData.name.trim()) {
      alert("O nome é obrigatório!");
      return;
    }

    if (!formData.phone.trim() || formData.phone.length < 15) {
      alert("O celular é obrigatório e deve estar completo!");
      return;
    }

    if (!formData.birth_date.trim() || formData.birth_date.length !== 10) {
      alert("A data de nascimento é obrigatória e deve estar completa!");
      return;
    }

    onSubmit({
      ...formData,
      name: formData.name.toUpperCase()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => handleCPFChange(e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            required
            className={cpfError ? "border-red-500" : ""}
          />
          {cpfError && (
            <p className="text-sm text-red-600">{cpfError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="birth_date">Data de Nascimento *</Label>
          <Input
            id="birth_date"
            value={formData.birth_date}
            onChange={(e) => setFormData({ ...formData, birth_date: maskBirthDate(e.target.value) })}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
          disabled={!!cpfError}
        >
          {client ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}