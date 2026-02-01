import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, Users, Package, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import ReportSelector from "../components/reports/ReportSelector";

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const urlParams = new URLSearchParams(window.location.search);
  const reportType = urlParams.get('type');

  if (reportType) {
    return <ReportSelector type={reportType} />;
  }

  const reports = [
    {
      title: "Vendas por Período",
      description: "Análise de vendas em um intervalo de datas",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      url: createPageUrl("Reports") + "?type=period"
    },
    {
      title: "Vendas por Cliente",
      description: "Ranking e análise por cliente",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      url: createPageUrl("Reports") + "?type=client"
    },
    {
      title: "Vendas por Produto",
      description: "Produtos mais vendidos e faturamento",
      icon: Package,
      color: "from-green-500 to-green-600",
      url: createPageUrl("Reports") + "?type=product"
    },
    {
      title: "Dashboard de Vendedores",
      description: "Desempenho e ranking de vendedores",
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      url: createPageUrl("Reports") + "?type=seller"
    },
    {
      title: "Formas de Pagamento",
      description: "Análise por método de pagamento",
      icon: TrendingUp,
      color: "from-pink-500 to-pink-600",
      url: createPageUrl("Reports") + "?type=payment"
    },
    {
      title: "Resumo Geral",
      description: "Dashboard com indicadores principais",
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      url: createPageUrl("Reports") + "?type=summary"
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--navy)' }}>
            <BarChart3 className="h-8 w-8" />
            Relatórios
          </h1>
          <p className="text-slate-600">Análises e indicadores de vendas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report, index) => (
            <Card
              key={index}
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 group"
              onClick={() => navigate(report.url)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${report.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2" style={{ color: 'var(--navy)' }}>
                    {report.title}
                  </CardTitle>
                  <p className="text-sm text-slate-600">{report.description}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${report.color}`}>
                  <report.icon className="h-8 w-8 text-white" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}