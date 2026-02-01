import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ShoppingCart, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date'),
    initialData: [],
  });

  const { data: saleItems } = useQuery({
    queryKey: ['saleItems'],
    queryFn: () => base44.entities.SaleItem.list(),
    initialData: [],
  });

  const activeProducts = products.filter(p => p.active).length;
  const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.sale_date);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    {
      title: "Produtos Ativos",
      value: activeProducts,
      icon: Package,
      color: "from-blue-500 to-blue-600",
      link: createPageUrl("Products")
    },
    {
      title: "Clientes",
      value: clients.length,
      icon: Users,
      color: "from-purple-500 to-purple-600",
      link: createPageUrl("Clients")
    },
    {
      title: "Vendas Hoje",
      value: todaySales,
      icon: ShoppingCart,
      color: "from-green-500 to-green-600",
      link: createPageUrl("Sales")
    },
    {
      title: "Total de Vendas",
      value: `R$ ${totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: "from-orange-500 to-orange-600",
      link: createPageUrl("Sales")
    },
  ];

  const handleNewSale = () => {
    navigate(createPageUrl("Sales") + "?action=new");
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--navy)' }}>
            Bem-vindo, {user?.full_name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-slate-600">Visão geral do seu sistema de vendas</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Link key={index} to={stat.link}>
              <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-0 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--navy)' }}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--navy)' }}>
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={handleNewSale}
                className="w-full h-20 text-base bg-gradient-to-r from-[#1e3a5f] to-[#10b981] hover:opacity-90"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Nova Venda
              </Button>
              <Link to={createPageUrl("Clients")}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 text-base border-2"
                  style={{ borderColor: 'var(--navy)', color: 'var(--navy)' }}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Cadastrar Cliente
                </Button>
              </Link>
              <Link to={createPageUrl("Products")}>
                <Button 
                  variant="outline" 
                  className="w-full h-20 text-base border-2"
                  style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
                >
                  <Package className="mr-2 h-5 w-5" />
                  Cadastrar Produto
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Sales Chart - Current Month */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: 'var(--navy)' }}>
              <BarChart3 className="h-5 w-5" />
              Vendas do Mês Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();
              
              // Filtrar vendas do mês atual
              const currentMonthSales = sales.filter(sale => {
                const saleDate = new Date(sale.sale_date);
                return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
              });

              // Agrupar vendas por dia
              const salesByDay = {};
              currentMonthSales.forEach(sale => {
                const saleDate = new Date(sale.sale_date);
                const day = saleDate.getDate();
                if (!salesByDay[day]) {
                  salesByDay[day] = 0;
                }
                salesByDay[day] += sale.total || 0;
              });

              // Criar array de dados para o gráfico
              const chartData = [];
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              for (let day = 1; day <= daysInMonth; day++) {
                chartData.push({
                  dia: day,
                  valor: salesByDay[day] || 0
                });
              }

              // Calcular indicadores do mês
              const totalValue = currentMonthSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
              const avgTicket = currentMonthSales.length > 0 ? totalValue / currentMonthSales.length : 0;
              
              // Quantidade total vendida (soma das quantidades dos itens)
              const currentMonthSaleIds = currentMonthSales.map(s => s.id);
              const currentMonthItems = saleItems.filter(item => currentMonthSaleIds.includes(item.sale_id));
              const totalQuantity = currentMonthItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
              
              // Clientes únicos
              const uniqueClients = new Set(currentMonthSales.map(s => s.client_id));
              const clientCount = uniqueClients.size;
              
              // Melhor vendedor (vendedor com maior valor de vendas)
              const salesBySeller = {};
              currentMonthSales.forEach(sale => {
                if (!salesBySeller[sale.seller_id]) {
                  salesBySeller[sale.seller_id] = {
                    name: sale.seller_name,
                    total: 0
                  };
                }
                salesBySeller[sale.seller_id].total += sale.total || 0;
              });
              
              const bestSeller = Object.values(salesBySeller).sort((a, b) => b.total - a.total)[0];

              return currentMonthSales.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Nenhuma venda registrada neste mês
                </div>
              ) : (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Dia do Mês', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <Tooltip 
                        formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Vendas']}
                        labelFormatter={(label) => `Dia ${label}`}
                      />
                      <Bar 
                        dataKey="valor" 
                        fill="url(#colorGradient)" 
                        radius={[8, 8, 0, 0]}
                        label={{ 
                          position: 'inside',
                          formatter: (value) => value > 0 ? `${value.toFixed(0)}` : '',
                          fill: '#ffffff',
                          fontSize: 11,
                          fontWeight: 'bold',
                          angle: -90
                        }}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="100%" stopColor="#1e3a5f" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Indicadores do Mês */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-slate-500">Valor Total</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                          R$ {totalValue.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-slate-500">Ticket Médio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                          R$ {avgTicket.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-slate-500">Qtd Vendida</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                          {totalQuantity}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-slate-500">Qtd Clientes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--navy)' }}>
                          {clientCount}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-slate-500">Melhor Vendedor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-base md:text-lg font-bold truncate" style={{ color: 'var(--green)' }}>
                          {bestSeller?.name || '-'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}