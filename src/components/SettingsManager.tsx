/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { AppState, WorkshopDetails } from '../types';
import { 
  Save, 
  RefreshCw, 
  Check, 
  Home, 
  Building2, 
  Phone, 
  FileSignature, 
  Landmark,
  Download,
  Upload,
  AlertTriangle,
  Database,
  CheckCircle2
} from 'lucide-react';
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
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const [importErrorMessage, setImportErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Export database to a downloaded JSON file
  const handleExportBackup = () => {
    try {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `${name.toLowerCase().replace(/\s+/g, '_')}_banco_de_dados_${dateStr}.json`;
      
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar backup:", err);
      alert("Houve um erro técnico ao empacotar o banco de dados.");
    }
  };

  // Import application state from uploaded JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsed = JSON.parse(fileContent);

        // Validating minimal schema pattern
        if (
          parsed &&
          typeof parsed === 'object' &&
          Array.isArray(parsed.companies) &&
          Array.isArray(parsed.vehicles) &&
          Array.isArray(parsed.serviceOrders)
        ) {
          const confirmMsg = 
            `Atenção: Carregar este backup substituirá permanentemente todos os dados atuais na memória por:\n\n` +
            `• ${parsed.companies.length} Clientes Corporativos\n` +
            `• ${parsed.vehicles.length} Veículos cadastrados\n` +
            `• ${parsed.serviceOrders.length} Ordens de Serviço (Orçamentos/Faturas)\n\n` +
            `Deseja prosseguir com a substituição?`;

          if (window.confirm(confirmMsg)) {
            // Apply imported state
            onUpdateState({
              ...parsed,
              currentUser: parsed.currentUser || state.currentUser,
              workshopDetails: parsed.workshopDetails || state.workshopDetails || { ...DEFAULT_WORKSHOP_DETAILS }
            });

            // Update local input bindings right away
            const nextDetails = parsed.workshopDetails || DEFAULT_WORKSHOP_DETAILS;
            setName(nextDetails.name || '');
            setSubtitle(nextDetails.subtitle || '');
            setAddress(nextDetails.address || '');
            setPhone(nextDetails.phone || '');
            setCnpj(nextDetails.cnpj || '');

            setImportSuccessMessage(`Backup restaurado com sucesso! Carregados ${parsed.serviceOrders.length} registros de faturamento.`);
            setImportErrorMessage('');
            setTimeout(() => setImportSuccessMessage(''), 6000);
          }
        } else {
          setImportErrorMessage("O arquivo de backup selecionado é inválido. Certifique-se de usar um arquivo .json gerado pelo menu de backup do PEÇAUTO.");
          setImportSuccessMessage('');
        }
      } catch (err) {
        console.error(err);
        setImportErrorMessage("Erro na decodificação do arquivo de backup. O JSON está corrompido ou mal-formatado.");
        setImportSuccessMessage('');
      }
    };

    reader.readAsText(file);
    // Clear input so same file can be uploaded again if needed
    e.target.value = '';
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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

      {/* Backup & Data Security Panel */}
      <div className="bg-[#0B0C0E] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-850 bg-gradient-to-r from-gray-900 to-[#0B0C0E] flex items-center gap-2">
          <Database className="w-4 h-4 text-[#FFC72C]" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#FFC72C] uppercase">
            CÓPIA DE SEGURANÇA & BACKUP INTEGRAL
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Security alert context answering user concern */}
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FFC72C] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-mono font-bold text-white uppercase tracking-wide">
                Existe chance dos dados serem perdidos?
              </h4>
              <p className="text-gray-400 font-sans leading-relaxed">
                <strong className="text-white">Sim.</strong> Por padrão, todos os dados de Orçamentos, Ordens de Serviço, Clientes e Veículos são salvos no <strong className="text-[#FFC72C]">localStorage</strong> do seu navegador. 
                Se você limpar os dados de navegação (cookies/cache), formatar o computador ou trocar de navegador, esses dados podem sumir.
              </p>
              <p className="text-gray-400 font-sans leading-relaxed mt-1">
                Para garantir segurança total contra perdas acidentais, use o botão azul abaixo para <strong className="text-white">guardar uma cópia (.json) semanal ou diária</strong> em um pendrive ou pasta segura. Através dele, você poderá recuperar o sistema inteiro a qualquer instante!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Export */}
            <div className="border border-gray-850 rounded-lg p-4 bg-[#111215] flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#FFC72C] uppercase tracking-wider block">
                  Exportar Banco de Dados
                </span>
                <p className="text-xs text-gray-400 font-sans leading-normal">
                  Salva tudo o que está cadastrado hoje em um arquivo compactado exclusivo que você pode guardar no seu computador.
                </p>
              </div>
              
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 px-4 rounded bg-gray-900 border border-gray-800 hover:border-gray-700 hover:text-[#FFC72C] hover:bg-black font-mono font-bold text-xs tracking-wider text-white uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#FFC72C]" />
                GERAR ARQUIVO DE BACKUP
              </button>
            </div>

            {/* Box 2: Import */}
            <div className="border border-gray-850 rounded-lg p-4 bg-[#111215] flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#FFC72C] uppercase tracking-wider block">
                  Restaurar Cópia Existente
                </span>
                <p className="text-xs text-gray-400 font-sans leading-normal">
                  Selecione um arquivo de backup gerado anteriormente para recarregar todos os dados de faturamentos e clientes corporativos.
                </p>
              </div>

              <div>
                {/* Hidden File Input */}
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportBackup}
                  accept=".json"
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="w-full py-2 px-4 rounded bg-[#FFC72C]/10 border border-[#FFC72C]/20 hover:border-[#FFC72C]/50 hover:bg-[#FFC72C]/20 font-mono font-bold text-xs tracking-wider text-[#FFC72C] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  IMPORTAR ARQUIVO DE BACKUP
                </button>
              </div>
            </div>

          </div>

          {/* Feedback states */}
          {importSuccessMessage && (
            <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {importErrorMessage && (
            <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{importErrorMessage}</span>
            </div>
          )}
        </div>
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
