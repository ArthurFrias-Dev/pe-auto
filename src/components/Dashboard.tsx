/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Company, Vehicle, ServiceOrder, AppState } from '../types';
import { 
  TrendingUp, 
  FileText, 
  Users, 
  Car, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { formatCurrency, calculateServiceOrderGrandTotals } from '../lib/db';

interface DashboardProps {
  state: AppState;
  onNavigate: (tab: string) => void;
  onSelectOrder: (orderId: string) => void;
}

export default function Dashboard({ state, onNavigate, onSelectOrder }: DashboardProps) {
  const { companies, vehicles, serviceOrders } = state;

  // Calculando estatísticas
  const stats = useMemo(() => {
    let closedTotalValue = 0;
    let budgetTotalValue = 0;
    let closedCount = 0;
    let budgetCount = 0;
    let totalDiscount = 0;

    serviceOrders.forEach(order => {
      const { grandTotal, discountTotal } = calculateServiceOrderGrandTotals(order);
      if (order.status === 'closed') {
        closedTotalValue += grandTotal;
        closedCount++;
        totalDiscount += discountTotal;
      } else {
        budgetTotalValue += grandTotal;
        budgetCount++;
      }
    });

    return {
      closedTotalValue,
      budgetTotalValue,
      closedCount,
      budgetCount,
      totalDiscount,
      totalCompanies: companies.length,
      totalVehicles: vehicles.length
    };
  }, [companies, vehicles, serviceOrders]);

  // Últimas Atividades / Ordens de Serviço Recentes
  const recentOrders = useMemo(() => {
    return [...serviceOrders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [serviceOrders]);

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Empresa desconhecida';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-black via-[#161719] to-black border border-gray-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-yellow-500/10 to-transparent blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white mb-2">
              PAINEL DE <span className="text-[#FFC72C]">DASHBOARD</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Sistema de gestão integrada de autopeças e frotas para parceiros comerciais corporativos. Controle orçamentos e faturamentos com alta performance.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('empresas')}
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider text-white border border-gray-700 bg-[#1e2022] hover:bg-black rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Users className="w-4 h-4 text-[#FFC72C]" />
              CLIENTES
            </button>
            <button
              onClick={() => onNavigate('ordens')}
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-[#FFC72C] hover:bg-[#E0A81C] text-black rounded-lg transition-all transform hover:scale-[1.02] cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              NOVO DETALHAMENTO
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Faturamento Fechado */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">TOTAL FATURADO</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-mono font-black text-white group-hover:text-[#FFC72C] transition-colors">
              {formatCurrency(stats.closedTotalValue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                {stats.closedCount} serviços
              </span>
              <span className="text-gray-500 text-xs font-mono">fechados</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Orçamentos em Aberto */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">ORÇAMENTOS EM ABERTO</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-[#FFC72C]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-mono font-black text-white">
              {formatCurrency(stats.budgetTotalValue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-[#FFC72C]">
                {stats.budgetCount} propostas
              </span>
              <span className="text-gray-500 text-xs font-mono">aguardando</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Descontos Projetados */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">DESCONTOS APLICADOS (PRO)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-mono font-black text-white">
              {formatCurrency(stats.totalDiscount)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-gray-400 text-xs font-mono">Apenas itens de peça</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Estatísticas de Frota */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-gray-400 tracking-wider">REGISTROS CORPORATIVOS</span>
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#FFC72C]/10 flex items-center justify-center text-[#FFC72C]">
                <Car className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-mono font-black text-white flex items-baseline gap-2">
              <span>{stats.totalCompanies}</span> <span className="text-xs font-sans text-gray-500 font-normal">empresas</span>
              <span className="text-gray-600 block">/</span>
              <span>{stats.totalVehicles}</span> <span className="text-xs font-sans text-gray-500 font-normal">veículos</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-gray-400 text-xs font-mono">Faturamento multi-veicular pronto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Quick Analytics Gauges & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Telemetry Chart Widget */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-6 flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="text-sm font-sans font-black text-white tracking-widest uppercase mb-4 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFC72C]"></span>
              EFICIÊNCIA DE OPERAÇÕES
            </h3>
            <p className="text-gray-400 text-xs mb-6">
              Distribuição de fechamentos rápidos vs. propostas técnicas.
            </p>
          </div>

          {/* Visual SVG Ring representing system billing state */}
          <div className="relative my-4 flex justify-center items-center">
            {/* Visual Gauge */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="65"
                stroke="#1B1C1F"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="65"
                stroke="#FFC72C"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 65}`}
                strokeDashoffset={`${2 * Math.PI * 65 * (1 - (stats.closedCount / Math.max(1, stats.closedCount + stats.budgetCount)))}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-mono font-black text-white">
                {Math.round((stats.closedCount / Math.max(1, stats.closedCount + stats.budgetCount)) * 100)}%
              </span>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">Aprovados</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800">
            <div className="text-center border-r border-gray-800">
              <p className="text-xs text-gray-400 font-mono">Fat. Concluído</p>
              <p className="text-lg font-mono font-bold text-emerald-400">{stats.closedCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-mono">Orçados</p>
              <p className="text-lg font-mono font-bold text-[#FFC72C]">{stats.budgetCount}</p>
            </div>
          </div>
        </div>

        {/* Recent Service Orders Timeline */}
        <div className="rounded-xl bg-[#131416] border border-gray-800 p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-sans font-black text-white tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                HISTÓRICO ATIVO RECENTE
              </h3>
              <button 
                onClick={() => onNavigate('resumos')} 
                className="text-xs text-[#FFC72C] hover:underline font-mono flex items-center gap-1 cursor-pointer"
              >
                Ver tudo <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs font-mono">
                  Nenhuma ordem de serviço cadastrada no banco local.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const totals = calculateServiceOrderGrandTotals(order);
                  return (
                    <div 
                      key={order.id} 
                      onClick={() => onSelectOrder(order.id)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-[#191A1D] border border-gray-800/40 hover:border-gray-700 hover:bg-[#1f2024] transition-all cursor-pointer"
                    >
                      <div className="space-y-1 mb-2 sm:mb-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-xs">
                            {order.title}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                            order.status === 'closed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-yellow-500/10 text-[#FFC72C] border border-yellow-500/20'
                          }`}>
                            {order.status === 'closed' ? 'Fat. Concluído' : 'Orçamento'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="font-semibold text-gray-300">
                            {getCompanyName(order.companyId)}
                          </span>
                          <span>•</span>
                          <span>{order.services.length} {order.services.length === 1 ? 'veículo' : 'veículos'}</span>
                          <span>•</span>
                          <span>{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 font-mono tracking-widest font-bold">TOTAL GERAL</p>
                          <p className="text-sm font-mono font-black text-white group-hover:text-[#FFC72C] transition-colors">{formatCurrency(totals.grandTotal)}</p>
                        </div>
                        <div className="w-7 h-7 rounded bg-[#131416] border border-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-500">
            <span>Último faturamento atualizado em tempo real.</span>
            <span className="font-mono text-[9px] bg-yellow-500/10 text-[#FFC72C] px-1.5 py-0.5 rounded font-black">
              LOCAL_STORAGE_INDEXED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
