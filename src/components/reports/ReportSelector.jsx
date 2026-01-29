import React from "react";
import PeriodReport from "./PeriodReport";
import ClientReport from "./ClientReport";
import ProductReport from "./ProductReport";
import SummaryReport from "./SummaryReport";
import SellerReport from "./SellerReport";
import PaymentReport from "./PaymentReport";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReportSelector({ type }) {
  const navigate = useNavigate();

  const reportTitles = {
    period: "Vendas por Período",
    client: "Vendas por Cliente",
    product: "Vendas por Produto",
    seller: "Dashboard de Vendedores",
    summary: "Resumo Geral",
    payment: "Formas de Pagamento"
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Reports"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>
            {reportTitles[type] || "Relatório"}
          </h1>
        </div>

        {type === "period" && <PeriodReport />}
        {type === "client" && <ClientReport />}
        {type === "product" && <ProductReport />}
        {type === "seller" && <SellerReport />}
        {type === "summary" && <SummaryReport />}
        {type === "payment" && <PaymentReport />}
      </div>
    </div>
  );
}