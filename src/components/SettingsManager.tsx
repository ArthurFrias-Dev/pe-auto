/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppState, WorkshopDetails } from '../types';
import { Save, RefreshCw, Check, Home, Building2, Phone, FileSignature, Landmark } from 'lucide-react';
import { DEFAULT_WORKSHOP_DETAILS } from '../lib/db';

interface SettingsManagerProps {
  state: AppState;
  onUpdateState: (next: AppState) => void;
}

export default function SettingsManager({ state, onUpdateState }: SettingsManagerProps) {
  const currentDetails = state.workshopDetails || DEFAULT_WORKSHOP_DETAILS;

  // Local input states
  const [name, setName] = useState(currentDetails.name);
  const [subtitle, setSubtitle] = useState(currentDetails.subtitle);
  const [address, setAddress] = useState(currentDetails.address);
  const [phone, setPhone] = useState(currentDetails.phone);
  const [cnpj, setCnpj] = useState(currentDetails.cnpj);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedDetails: WorkshopDetails = {
      name: name.trim(),
      subtitle: subtitle.trim(),
      address: address.trim(),
      phone: phone.trim(),
      cnpj: cnpj.trim(),
    };

    onUpdateState({
      ...state,
      workshopDetails: updatedDetails,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("Deseja restaurar as configurações padrão da PEÇAUTO?")) {
      setName(DEFAULT_WORKSHOP_DETAILS.name);
      setSubtitle(DEFAULT_WORKSHOP_DETAILS.subtitle);
      setAddress(DEFAULT_WORKSHOP_DETAILS.address);
      setPhone(DEFAULT_WORKSHOP_DETAILS.phone);
      setCnpj(DEFAULT_WORKSHOP_DETAILS.cnpj);

      onUpdateState({
        ...state,
        workshopDetails: { ...DEFAULT_WORKSHOP_DETAILS },
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="settings-manager-pane">
      
      {/* Intro Header */}
      <div>
        <h2 className="text-xl font-sans font-black tracking-tight text-white flex items-center gap-2">
          <Landmark className="w-5 h-5 text-[#FFC72C]" />
          AJUSTES DO EMISSOR (PEÇAUTO)
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Personalize as informações de cabeçalho, endereço e CNPJ que aparecem na nota fiscal e na faturamento em PDF.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#0B0C0E] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-850 bg-gradient-to-r from-gray-900 to-[#0B0C0E] flex items-center justify-between">
          <span className="text-xs font-mono font-bold tracking-wider text-[#FFC72C] uppercase">
            Identidade Organizacional e Localização
          </span>
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="text-gray-400 hover:text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Restaurar dados originais"
          >
            <RefreshCw className="w-3 h-3" />
            RESTAURAR PADRÕES
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Field: Store Brand Name */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Nome da Marca (Principal)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Landmark className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111215] border border-gray-800 focus:border-[#FFC72C] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  placeholder="Ex: PEÇAUTO"
                />
              </div>
              <p className="text-[10px] text-gray-505 font-mono">Nome destacado de cabeçalho na nota (ex: PEÇAUTO).</p>
            </div>

            {/* Field: Corporate Subtitle / Legal Name */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Razão Social / Subtítulo Comercial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#111215] border border-gray-800 focus:border-[#FFC72C] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  placeholder="Ex: Apex Autopeças & Serviços"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Descrição corporativa do remetente.</p>
            </div>

            {/* Field: Full Address */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Endereço Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Home className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#111215] border border-gray-800 focus:border-[#FFC72C] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  placeholder="Ex: Rua da Embreagem Mecânica, 3000 • São Paulo, SP"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Endereço impresso no topo e rodapé do faturamento.</p>
            </div>

            {/* Field: CNPJ */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                CNPJ do Emissor (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <FileSignature className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full bg-[#111215] border border-gray-800 focus:border-[#FFC72C] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  placeholder="12.345.678/0001-00"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Registro oficial para o rodapé do documento.</p>
            </div>

            {/* Field: Phone */}
            <div className="space-y-1.5 col-span-1">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Telefone de Contato
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#111215] border border-gray-800 focus:border-[#FFC72C] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none transition-colors"
                  placeholder="(11) 5555-4444"
                />
              </div>
              <p className="text-[10px] text-gray-500 font-mono">Contate este emissor.</p>
            </div>

          </div>

          {/* Action Buttons Row */}
          <div className="pt-4 border-t border-gray-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSaved && (
                <span className="text-[#FFC72C] text-xs font-mono font-bold flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  DADOS ATUALIZADOS COM SUCESSO!
                </span>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#FFC72C] text-black font-mono font-black text-xs tracking-wider uppercase hover:bg-yellow-400 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,199,44,0.15)] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              GRAVAR EM MEMÓRIA
            </button>
          </div>
        </form>
      </div>

      {/* Responsive Preview Panel */}
      <div className="bg-[#0B0C0E] border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
          Visualização Dinâmica de Pré-impressão:
        </h3>
        <div className="border border-gray-850 rounded-lg p-5 bg-[#070809] space-y-2">
          <div className="flex justify-between items-start border-b border-gray-850 pb-3">
            <div>
              <h4 className="text-sm font-sans font-black tracking-wider text-white uppercase">
                {name || 'PEÇAUTO'}
              </h4>
              <p className="text-xs text-gray-400 font-mono">{subtitle || 'Subtítulo da Loja'}</p>
              <p className="text-[10px] text-gray-505 font-mono">{address || 'Endereço Completo'}</p>
            </div>
            <div className="text-right font-mono text-[10px] text-gray-500">
              <p>CNPJ: {cnpj || '12.345.678/0001-00'}</p>
              <p>FONE: {phone || '(11) 5555-4444'}</p>
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-600 font-mono italic pt-2">
            Este cabeçalho será aplicado instantaneamente na visualização e na compilação do seu PDF.
          </p>
        </div>
      </div>

    </div>
  );
}
