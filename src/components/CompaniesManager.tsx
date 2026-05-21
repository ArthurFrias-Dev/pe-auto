/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Company, Vehicle, AppState } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Phone, 
  FileText, 
  X, 
  Briefcase,
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { generateId } from '../lib/db';

interface CompaniesManagerProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export default function CompaniesManager({ state, onUpdateState }: CompaniesManagerProps) {
  const { companies, vehicles } = state;

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Alerts
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'detail' | 'error'; text: string } | null>(null);

  // Filtered List
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(searchLower) ||
        (c.cnpj && c.cnpj.toLowerCase().includes(searchLower)) ||
        c.phone.toLowerCase().includes(searchLower)
      );
    });
  }, [companies, searchTerm]);

  // Helper: Get vehicle count for a company
  const getVehicleCount = (companyId: string) => {
    return vehicles.filter(v => v.companyId === companyId).length;
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setName('');
    setCnpj('');
    setPhone('');
    setNotes('');
    setIsModalOpen(true);
    setAlertMsg(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setCnpj(company.cnpj || '');
    setPhone(company.phone);
    setNotes(company.notes);
    setIsModalOpen(true);
    setAlertMsg(null);
  };

  // Trigger Alert Auto Dismiss
  const triggerAlert = (type: 'success' | 'detail' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  // Save / Update logic
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerAlert('error', 'O nome da empresa é obrigatório.');
      return;
    }

    if (editingCompany) {
      // Update
      const updatedList = companies.map(c => {
        if (c.id === editingCompany.id) {
          return {
            ...c,
            name: name.trim(),
            cnpj: cnpj.trim(),
            phone: phone.trim(),
            notes: notes.trim(),
          };
        }
        return c;
      });

      const nextState = { ...state, companies: updatedList };
      onUpdateState(nextState);
      triggerAlert('success', `Empresa "${name}" atualizada com sucesso!`);
      setIsModalOpen(false);
    } else {
      // Create new
      const newCompany: Company = {
        id: generateId('c'),
        name: name.trim(),
        cnpj: cnpj.trim() || undefined,
        phone: phone.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextState = {
        ...state,
        companies: [newCompany, ...companies],
      };
      onUpdateState(nextState);
      triggerAlert('success', `Empresa "${name}" cadastrada com sucesso!`);
      setIsModalOpen(false);
    }
  };

  // Delete matching rules
  const handleDelete = (company: Company) => {
    const connectedVehicles = getVehicleCount(company.id);
    if (connectedVehicles > 0) {
      triggerAlert('error', `Não é possível deletar esta empresa porque existem ${connectedVehicles} veículos cadastrados vinculados a ela.`);
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover a empresa "${company.name}"? Esta ação não pode ser desfeita.`)) {
      const updatedList = companies.filter(c => c.id !== company.id);
      
      // Also filter any service orders (budget states) associated if matches? But user asks database sanity.
      const nextState = {
        ...state,
        companies: updatedList
      };
      onUpdateState(nextState);
      triggerAlert('success', 'Empresa excluída do banco de dados local.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-white uppercase">
            CADASTRO DE <span className="text-[#FFC72C]">EMPRESAS PARCEIRAS</span>
          </h2>
          <p className="text-gray-400 text-xs">
            Gerencie as pessoas jurídicas ou autônomos credenciados de faturamento.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-[#FFC72C] hover:bg-[#E0A81C] text-black rounded-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          CADASTRAR EMPRESA
        </button>
      </div>

      {/* Alerts AlertBox */}
      {alertMsg && (
        <div className={`p-4 rounded-lg flex items-start gap-3 border ${
          alertMsg.type === 'error' 
            ? 'bg-red-950/20 text-red-400 border-red-500/30' 
            : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
        }`}>
          {alertMsg.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          )}
          <span className="text-xs font-mono font-bold">{alertMsg.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Pesquisa rápida de empresa por nome, CNPJ ou telefone comercial..."
          className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg pl-10 pr-4 py-3 outline-none transition-all placeholder-gray-500 font-mono"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Companies List Grid */}
      {filteredCompanies.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-gray-800 bg-[#131416]/50">
          <Building className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-300 font-mono">Nenhuma empresa encontrada</h3>
          <p className="text-xs text-gray-500 mt-1">Refine seus termos de pesquisa ou crie um novo cadastro corporativo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const vehiclesCount = getVehicleCount(company.id);
            return (
              <div 
                key={company.id}
                className="group relative rounded-xl border border-gray-850 bg-[#131416] hover:bg-[#181a1d] hover:border-[#FFC72C]/40 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="space-y-0.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-gray-850 text-gray-400">
                        ID: {company.id}
                      </span>
                      <h4 className="text-sm font-sans font-black text-white group-hover:text-[#FFC72C] transition-colors uppercase">
                        {company.name}
                      </h4>
                    </div>
                    <div className="p-2 rounded-lg bg-[#FFC72C]/10 text-[#FFC72C]">
                      <Building className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="space-y-2 text-xs font-mono pt-2 border-t border-gray-800/40">
                    {company.cnpj && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">CNPJ:</span>
                        <span className="text-gray-300 font-bold">{company.cnpj}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">TELEFONE:</span>
                      <span className="text-gray-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#FFC72C]" />
                        {company.phone || 'Sem telefone'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">FROTA ATIVA:</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-500/10 text-[#FFC72C] font-black">
                        {vehiclesCount} {vehiclesCount === 1 ? 'veículo' : 'veículos'}
                      </span>
                    </div>
                  </div>

                  {company.notes && (
                    <div className="mt-4 p-2.5 rounded bg-[#1C1D20] text-gray-400 text-[11px] font-mono flex items-start gap-1.5 border-l-2 border-[#FFC72C]/55">
                      <FileText className="w-3.5 h-3.5 mt-0.5 text-[#FFC72C] flex-shrink-0" />
                      <span className="line-clamp-2">{company.notes}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-gray-800/60 justify-end">
                  <button
                    onClick={() => handleOpenEditModal(company)}
                    className="p-2 rounded bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Editar informações"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(company)}
                    className="p-2 rounded bg-red-950/20 hover:bg-red-650 hover:text-white text-red-400 border border-red-500/10 transition-colors cursor-pointer"
                    title="Remover Empresa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cadastrar/Editar Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-gray-800 bg-[#131416] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1A1C1F]">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#FFC72C]" />
                <h3 className="text-sm font-sans font-black text-white tracking-widest uppercase">
                  {editingCompany ? 'EDITAR EMPRESA PARCEIRA' : 'NOVA EMPRESA PARCEIRA'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                  Nome / Razão Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Transportadora Silva S/A"
                  className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    CNPJ (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-mono"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Telefone de Contato
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 99999-8888"
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-mono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                  Observações de Cobrança / Frota
                </label>
                <textarea
                  rows={4}
                  placeholder="Ex: Regras fiscais personalizadas, faturamento sob boleto..."
                  className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-sans"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-800 bg-[#1C1D20] hover:bg-black text-gray-400 text-xs font-mono font-bold hover:text-white transition-colors cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#FFC72C] hover:bg-[#E0A81C] text-black text-xs font-mono font-bold transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {editingCompany ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR CADASTRO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
