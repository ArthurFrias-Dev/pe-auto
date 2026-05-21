/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { AppState, ServiceOrder } from './types';
import { getInitialState, saveState, formatCurrency } from './lib/db';
import Logo from './components/Logo';
import Dashboard from './components/Dashboard';
import CompaniesManager from './components/CompaniesManager';
import VehiclesManager from './components/VehiclesManager';
import ServiceOrderForm from './components/ServiceOrderForm';
import HistoryViewer from './components/HistoryViewer';
import SettingsManager from './components/SettingsManager';
import { 
  Tv, 
  Users, 
  Car, 
  FileText, 
  History, 
  Shield, 
  User, 
  Bell, 
  Database,
  Grid,
  Menu,
  X,
  Plus,
  Settings
} from 'lucide-react';

export default function App() {
  // Global State Engine loaded once dynamically from localStorage
  const [state, setState] = useState<AppState>(() => getInitialState());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Shared state references for active operations
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Responsive mobile menu control
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync React changes back to database file
  const handleUpdateGlobalState = (nxt: AppState) => {
    setState(nxt);
    saveState(nxt);
  };

  // Switch profiles to demo user-role permissions ("possibilidade futura de login")
  const handleSwitchRole = (role: string) => {
    const nextUser = {
      name: role === 'Administrador' ? 'Mecânico Chefe' : role === 'Recepcionista' ? 'Atendente Caixa' : 'Auxiliar Técnico',
      role: role,
      isLoggedIn: true
    };
    handleUpdateGlobalState({
      ...state,
      currentUser: nextUser
    });
  };

  // Fast navigator helpers
  const handleEditOrder = (orderId: string) => {
    setEditingOrderId(orderId);
    setActiveTab('nova_os');
  };

  const handleSelectOrderAndNavigate = (orderId: string | null) => {
    setSelectedOrderId(orderId);
    setActiveTab('resumos');
  };

  // Close Mobile menu automatically on navigation
  const navigateToTab = (tab: string) => {
    setIsMobileMenuOpen(false);
    
    // Clear sub-states on clean tab navigation
    if (tab === 'nova_os') {
      setEditingOrderId(null);
    } else if (tab === 'resumos') {
      setSelectedOrderId(null);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#070809] text-gray-200 font-sans flex flex-col selection:bg-[#FFC72C] selection:text-black">
      
      {/* Structural Top Header Banner */}
      <header className="sticky top-0 z-40 bg-[#0B0C0E]/95 border-b border-gray-800/80 backdrop-blur-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo className="cursor-pointer" onClick={() => navigateToTab('dashboard')} />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => navigateToTab('dashboard')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dashboard' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              DASHBOARD
            </button>
            <button
              onClick={() => navigateToTab('empresas')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'empresas' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              EMPRESAS
            </button>
            <button
              onClick={() => navigateToTab('veiculos')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'veiculos' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              VEÍCULOS
            </button>
            <button
              onClick={() => navigateToTab('nova_os')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'nova_os' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              REVISÃO / FECHAMENTO
            </button>
            <button
              onClick={() => navigateToTab('resumos')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'resumos' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              REPOSITÓRIO OS
            </button>
            <button
              onClick={() => navigateToTab('configuracoes')}
              className={`px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuracoes' 
                  ? 'bg-yellow-500/10 text-[#FFC72C]' 
                  : 'text-gray-405 hover:text-white hover:bg-[#151619]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              AJUSTES EMISSOR
            </button>
          </nav>

          {/* Right corner indicators & User Sandbox Switcher */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Simulation role selection card */}
            <div className="flex items-center gap-1.5 bg-[#121316] border border-gray-800 rounded-lg px-2.5 py-1 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#FFC72C]" />
              <select
                className="bg-transparent text-[11px] font-mono text-gray-300 font-bold outline-none border-none cursor-pointer"
                value={state.currentUser?.role || 'Administrador'}
                onChange={(e) => handleSwitchRole(e.target.value)}
                title="Simulador de Perfis de Usuário"
              >
                <option value="Administrador">Admin (Completo)</option>
                <option value="Recepcionista">Faturamento (Recepcionista)</option>
                <option value="Mecanico">Executante (Oficina)</option>
              </select>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#1A1C20] border border-gray-800 flex items-center justify-center text-gray-400 select-none">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* Mobile responsive toggle */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile navigation side menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0B0D] border-b border-gray-850 py-3 px-4 space-y-1.5 no-print">
          <button
            onClick={() => navigateToTab('dashboard')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            DASHBOARD
          </button>
          <button
            onClick={() => navigateToTab('empresas')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'empresas' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            EMPRESAS PARCEIRAS
          </button>
          <button
            onClick={() => navigateToTab('veiculos')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'veiculos' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <Car className="w-4 h-4" />
            VEÍCULOS DE FROTA
          </button>
          <button
            onClick={() => navigateToTab('nova_os')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'nova_os' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            VINCULAR NOVA O.S.
          </button>
          <button
            onClick={() => navigateToTab('resumos')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'resumos' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            HISTÓRICO & EXPORTAR
          </button>
          <button
            onClick={() => navigateToTab('configuracoes')}
            className={`w-full text-left px-3 py-2 text-xs font-mono font-bold rounded-md flex items-center gap-2 ${
              activeTab === 'configuracoes' ? 'bg-[#FFC72C] text-black' : 'text-gray-305 hover:bg-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            DADOS PEÇAUTO
          </button>

          <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-500">
            <span>Perfil Ativo: {state.currentUser?.role}</span>
            <button 
              onClick={() => handleSwitchRole(state.currentUser?.role === 'Administrador' ? 'Recepcionista' : 'Administrador')}
              className="text-[#FFC72C] underline cursor-pointer"
            >
              Mudar
            </button>
          </div>
        </div>
      )}

      {/* Main Structural Space Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Render correct tab dynamically with micro-interactions wrapper */}
        <div className="animate-fade-in duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard 
              state={state} 
              onNavigate={navigateToTab} 
              onSelectOrder={handleSelectOrderAndNavigate}
            />
          )}

          {activeTab === 'empresas' && (
            <CompaniesManager 
              state={state} 
              onUpdateState={handleUpdateGlobalState} 
            />
          )}

          {activeTab === 'veiculos' && (
            <VehiclesManager 
              state={state} 
              onUpdateState={handleUpdateGlobalState} 
            />
          )}

          {activeTab === 'nova_os' && (
            <ServiceOrderForm 
              state={state} 
              onUpdateState={handleUpdateGlobalState} 
              editingOrderId={editingOrderId}
              onCancelEdit={() => navigateToTab('resumos')}
              onNavigateToHistory={() => navigateToTab('resumos')}
            />
          )}

          {activeTab === 'resumos' && (
            <HistoryViewer 
              state={state} 
              onUpdateState={handleUpdateGlobalState} 
              onEditOrder={handleEditOrder}
              selectedOrderId={selectedOrderId}
              onSelectOrder={setSelectedOrderId}
            />
          )}

          {activeTab === 'configuracoes' && (
            <SettingsManager 
              state={state} 
              onUpdateState={handleUpdateGlobalState} 
            />
          )}
        </div>

      </main>

      {/* Footer Branding, Offline database, printing blocks */}
      <footer className="bg-[#090A0C] border-t border-gray-850 py-5 text-center mt-12 text-xs text-gray-500 font-mono no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-black animate-pulse"></span>
            <span>Estação de Trabalho Autotecnológica PEÇAUTO • Banco de Dados Ativo Local</span>
          </div>
          <p className="text-[10px] text-gray-650">
            © 2026 PEÇAUTO Workshop System. Todos os direitos reservados. Tema Licenciado Pro Automotive.
          </p>
        </div>
      </footer>
    </div>
  );
}
