/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Company, Vehicle, ServiceOrder, VehicleService, PartItem, AppState } from '../types';
import { 
  Plus, 
  Trash2, 
  Info, 
  Car, 
  Building, 
  Wrench, 
  Percent, 
  DollarSign, 
  AlertTriangle,
  Save, 
  CheckCircle,
  FileText,
  BadgePercent,
  X,
  FileCheck
} from 'lucide-react';
import { 
  generateId, 
  formatCurrency, 
  calculatePartsSubtotal, 
  calculatePartsDiscount, 
  calculateVehicleTotal 
} from '../lib/db';

interface ServiceOrderFormProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  editingOrderId: string | null;
  onCancelEdit: () => void;
  onNavigateToHistory: () => void;
}

export default function ServiceOrderForm({ 
  state, 
  onUpdateState, 
  editingOrderId, 
  onCancelEdit,
  onNavigateToHistory
}: ServiceOrderFormProps) {
  const { companies, vehicles, serviceOrders } = state;

  // Mode validation
  const isEditingMode = !!editingOrderId;

  // Selected O.S. state (or fresh configuration)
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [title, setTitle] = useState('');
  const [observations, setObservations] = useState('');
  const [status, setStatus] = useState<'budget' | 'closed'>('budget');
  
  // Array of services for each vehicle added
  const [services, setServices] = useState<VehicleService[]>([]);

  // Temp parts input fields indexed by vehicleServiceId
  const [tempPartName, setTempPartName] = useState<{ [serviceId: string]: string }>({});
  const [tempPartQty, setTempPartQty] = useState<{ [serviceId: string]: number }>({});
  const [tempPartPrice, setTempPartPrice] = useState<{ [serviceId: string]: number }>({});

  // Auto save visual confirmation hook
  const [autoSaveActive, setAutoSaveActive] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Em sincronização...');

  // Load existing Service Order details if in Edit mode
  useEffect(() => {
    if (isEditingMode && editingOrderId) {
      const order = serviceOrders.find(so => so.id === editingOrderId);
      if (order) {
        setSelectedCompanyId(order.companyId);
        setTitle(order.title);
        setObservations(order.observations);
        setStatus(order.status);
        setServices(JSON.parse(JSON.stringify(order.services))); // Deep copy
      }
    } else {
      // Setup default title with current date
      const today = new Date();
      const dateStr = today.toLocaleDateString('pt-BR');
      setTitle(`Revisão de Frota - ${dateStr}`);
      setSelectedCompanyId(companies[0]?.id || '');
      setObservations('');
      setStatus('budget');
      setServices([]);
    }
  }, [editingOrderId, isEditingMode, companies, serviceOrders]);

  // Clean services list if company changes (since vehicles differ)
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setServices([]); // Reset vehicle services as they belong to another company frotas
  };

  // Vehicles belonging to the currently selected company
  const companyVehicles = useMemo(() => {
    if (!selectedCompanyId) return [];
    return vehicles.filter(v => v.companyId === selectedCompanyId);
  }, [selectedCompanyId, vehicles]);

  // All vehicles currently added to this service order faturamento
  const currentVehicleIds = useMemo(() => {
    return services.map(s => s.vehicleId);
  }, [services]);

  // Available vehicles of the company that haven't been added yet
  const availableVehiclesToAdd = useMemo(() => {
    return companyVehicles.filter(v => !currentVehicleIds.includes(v.id));
  }, [companyVehicles, currentVehicleIds]);

  // Add a vehicle to the current Service Order closure
  const handleAddVehicleToClosure = (vehicleId: string) => {
    if (!vehicleId) return;

    const newService: VehicleService = {
      id: generateId('vs'),
      vehicleId,
      parts: [],
      laborDescription: 'Revisão periódica preventiva e avaliação eletrônica de falhas.',
      laborPrice: 0,
      discountType: 'percentage',
      discountValue: 0
    };

    setServices([...services, newService]);
  };

  // Delete a vehicle entirely from this bundle
  const handleRemoveVehicleFromClosure = (serviceId: string) => {
    if (window.confirm("Deseja remover este veículo e todos os seus itens associados deste fechamento?")) {
      setServices(services.filter(s => s.id !== serviceId));
    }
  };

  // Update labor pricing
  const handleLaborPriceChange = (serviceId: string, price: number) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        return { ...s, laborPrice: Math.max(0, price) };
      }
      return s;
    }));
  };

  // Update labor text description
  const handleLaborDescriptionChange = (serviceId: string, desc: string) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        return { ...s, laborDescription: desc };
      }
      return s;
    }));
  };

  // Update Discount fields
  const handleDiscountChange = (serviceId: string, type: 'percentage' | 'fixed', value: number) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        return { 
          ...s, 
          discountType: type, 
          discountValue: Math.max(0, value) 
        };
      }
      return s;
    }));
  };

  // Adds an itemized part to a vehicle service
  const handleAddPartItem = (serviceId: string) => {
    const pName = tempPartName[serviceId]?.trim();
    const pQty = tempPartQty[serviceId] || 1;
    const pPrice = tempPartPrice[serviceId] || 0;

    if (!pName) {
      alert("Por favor, digite o nome da peça utilizada.");
      return;
    }

    const newPart: PartItem = {
      id: generateId('p'),
      name: pName,
      quantity: Math.max(1, pQty),
      unitPrice: Math.max(0, pPrice)
    };

    setServices(services.map(s => {
      if (s.id === serviceId) {
        return { ...s, parts: [...s.parts, newPart] };
      }
      return s;
    }));

    // Reset part temp inputs for this specific service card
    setTempPartName({ ...tempPartName, [serviceId]: '' });
    setTempPartQty({ ...tempPartQty, [serviceId]: 1 });
    setTempPartPrice({ ...tempPartPrice, [serviceId]: 0 });
  };

  // Deletes an itemized part from a vehicle service
  const handleRemovePartItem = (serviceId: string, partId: string) => {
    setServices(services.map(s => {
      if (s.id === serviceId) {
        return { ...s, parts: s.parts.filter(p => p.id !== partId) };
      }
      return s;
    }));
  };

  // Financial Grand totals across all vehicles
  const grandTotals = useMemo(() => {
    let partsSubtotal = 0;
    let laborSubtotal = 0;
    let discountSubtotal = 0;
    let totalGeneral = 0;

    services.forEach(s => {
      const pSub = calculatePartsSubtotal(s.parts);
      const pDisc = calculatePartsDiscount(s.parts, s.discountType, s.discountValue);
      const vehicleTotal = calculateVehicleTotal(s);

      partsSubtotal += pSub;
      discountSubtotal += pDisc;
      laborSubtotal += s.laborPrice;
      totalGeneral += vehicleTotal;
    });

    return {
      partsSuball: partsSubtotal,
      partsDiscAll: discountSubtotal,
      laborAll: laborSubtotal,
      totalAll: totalGeneral
    };
  }, [services]);

  // Simulate active reactive saving trigger
  useEffect(() => {
    if (services.length > 0) {
      setAutoSaveActive(true);
      setSaveMessage('Salvando alterações...');
      const timer = setTimeout(() => {
        setAutoSaveActive(false);
        setSaveMessage('Sincronizado');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [services, title, observations, status, selectedCompanyId]);

  // Submit / Write to Database state logic
  const handleSaveServiceOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCompanyId) {
      alert("Por favor, selecione uma empresa parceira.");
      return;
    }
    if (services.length === 0) {
      alert("Você precisa adicionar pelo menos um veículo frotista a este faturamento.");
      return;
    }

    const targetId = isEditingMode ? (editingOrderId || '') : generateId('so');
    
    const preparedOrder: ServiceOrder = {
      id: targetId,
      companyId: selectedCompanyId,
      status: status,
      title: title.trim() || 'Fechamento de Serviços Geral',
      services: services,
      observations: observations.trim(),
      createdAt: isEditingMode 
        ? (serviceOrders.find(so => so.id === editingOrderId)?.createdAt || new Date().toISOString())
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: status === 'closed' ? new Date().toISOString() : null,
    };

    let nextOrdersList = [];
    if (isEditingMode) {
      nextOrdersList = serviceOrders.map(so => so.id === targetId ? preparedOrder : so);
    } else {
      nextOrdersList = [preparedOrder, ...serviceOrders];
    }

    onUpdateState({
      ...state,
      serviceOrders: nextOrdersList
    });

    onNavigateToHistory();
  };

  const getVehicleDetails = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId) || {
      plate: 'DESCONHECIDO',
      model: 'Modelo N/A',
      brand: 'Marca N/A',
      year: 0
    };
  };

  return (
    <form onSubmit={handleSaveServiceOrder} className="space-y-6">
      {/* Top action header and auto saver display */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-800 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-sans font-black text-white uppercase tracking-tight">
            {isEditingMode ? 'EDITAR' : 'NOVO'} <span className="text-[#FFC72C]">FECHAMENTO / ORÇAMENTO</span>
          </h2>
          <p className="text-gray-400 text-xs">
            Associe múltiplos frotistas a uma mesma empresa e deduza descontos diretamente nas peças do orçamento.
          </p>
        </div>

        {/* Auto save blinking notification */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black border border-gray-800 rounded-full">
            <span className={`w-2 h-2 rounded-full ${autoSaveActive ? 'bg-[#FFC72C] animate-ping' : 'bg-green-500'}`}></span>
            <span className="text-[10px] font-mono text-gray-400 select-none uppercase tracking-widest">{saveMessage}</span>
          </div>

          <button
            type="button"
            onClick={onCancelEdit}
            className="px-3 py-2 text-xs font-mono font-bold text-gray-400 border border-gray-800 bg-[#141517] hover:text-white rounded-lg cursor-pointer transition-colors"
          >
            VOLTAR
          </button>
        </div>
      </div>

      {/* Main layout parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Company core fields, Status and Overall description */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border border-gray-800 bg-[#131416] p-5 space-y-4">
            
            <h3 className="text-xs font-mono font-bold text-[#FFC72C] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              1. DADOS DE IDENTIFICAÇÃO
            </h3>

            {/* Title / Identificador */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase font-black">
                Título / Identificador da O.S. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                placeholder="Ex: Manutenção Mensal Amortecedores"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Company Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase font-black">
                Selecione a Empresa <span className="text-red-500">*</span>
              </label>
              <select
                disabled={isEditingMode || services.length > 0}
                required
                className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 disabled:opacity-50 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
              >
                <option value="" disabled>Selecione uma empresa corporativa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {services.length > 0 && (
                <p className="text-[9px] text-[#FFC72C] font-mono leading-tight">
                  ℹ️ Para alterar a empresa parceira, remova todos os veículos cadastrados do fechamento atual primeiro.
                </p>
              )}
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase font-black">
                Tipo do Documento / Faturamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('budget')}
                  className={`p-3 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'budget'
                      ? 'bg-yellow-500/10 border-[#FFC72C] text-[#FFC72C]'
                      : 'bg-[#1C1D20] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  ORÇAMENTO
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('closed')}
                  className={`p-3 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'closed'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-[#1C1D20] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  FATURAMENTO
                </button>
              </div>
            </div>

            {/* Observations text */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase font-black">
                Observações Gerais e Condições
              </label>
              <textarea
                rows={4}
                className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                placeholder="Ex: Faturado para 30 dias via faturamento integrado. Peças originais de fábrica."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Quick Billing Checklist Summary Panel - Dynamic Math */}
          <div className="rounded-xl border border-gray-800 bg-[#0F1012] p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              RESUMO ATUAL DO ARQUIVO
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-gray-400">
                <span>SUBTOTAL DE PEÇAS:</span>
                <span className="text-white font-bold">{formatCurrency(grandTotals.partsSuball)}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>(-) DESCONTOS EM PEÇAS:</span>
                <span>{formatCurrency(grandTotals.partsDiscAll)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>SUBTOTAL MÃO DE OBRA:</span>
                <span className="text-white font-bold">{formatCurrency(grandTotals.laborAll)}</span>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-gray-300">VALOR TOTAL FINAL:</span>
                <span className="text-xl font-black text-[#FFC72C]">
                  {formatCurrency(grandTotals.totalAll)}
                </span>
              </div>
            </div>

            {/* Direct Save Action */}
            <button
              type="submit"
              className="w-full py-3 bg-[#FFC72C] hover:bg-[#E0A81C] text-black font-mono font-black text-xs uppercase tracking-wider rounded-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditingMode ? 'CONFIRMAR EDIÇÃO OS' : 'GRAVAR ORDEM E IMPRIMIR'}
            </button>
          </div>
        </div>

        {/* Right column: Multi-vehicle management list */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Section Selector / Add vehicle bar */}
          <div className="rounded-xl border border-gray-800 bg-[#131416] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#FFC72C]" />
                  2. VEÍCULOS NO FECHAMENTO ({services.length})
                </h3>
                <p className="text-gray-400 text-xs">
                  Adicione um ou vários veículos corporativos associados a esta empresa no mesmo faturamento.
                </p>
              </div>

              {/* Add vehicles selection layout */}
              <div className="flex gap-2 max-w-sm">
                {availableVehiclesToAdd.length === 0 ? (
                  <div className="text-[10px] text-gray-400 font-mono italic p-2 bg-black border border-gray-800 rounded">
                    {companyVehicles.length === 0 
                      ? 'Nenhum frotista registrado para esta empresa.' 
                      : 'Todos os frotistas já estão no fechamento.'}
                  </div>
                ) : (
                  <select
                    className="text-xs text-white bg-[#1C1D20] border border-gray-800 rounded-lg p-2 outline-none font-mono"
                    defaultValue=""
                    onChange={(e) => {
                      handleAddVehicleToClosure(e.target.value);
                      e.target.value = ""; // Reset
                    }}
                  >
                    <option value="" disabled>+ Adicionar veículo...</option>
                    {availableVehiclesToAdd.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.plate} ({v.model})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* List of active vehicle closures */}
          <div className="space-y-6">
            {services.length === 0 ? (
              <div className="p-16 border border-dashed border-gray-800 rounded-xl bg-black/40 text-center flex flex-col items-center justify-center">
                <Car className="w-12 h-12 text-gray-700 mb-2" />
                <h4 className="text-xs font-mono font-bold text-gray-400">Nenhum frotista ativo na fatura</h4>
                <p className="text-gray-500 text-xs mt-1 max-w-sm">
                  Utilize a ferramenta de seleção acima para vincular os carros correspondentes desta empresa ao grupo de serviços corrente.
                </p>
              </div>
            ) : (
              services.map((service, sIndex) => {
                const vehicle = getVehicleDetails(service.vehicleId);
                const partsSub = calculatePartsSubtotal(service.parts);
                const partsDisc = calculatePartsDiscount(service.parts, service.discountType, service.discountValue);
                const vTotal = calculateVehicleTotal(service);

                return (
                  <div 
                    key={service.id} 
                    className="rounded-xl border border-gray-800 bg-[#131416] p-5 space-y-4 hover:border-gray-700 transition-all"
                  >
                    {/* Vehicle Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-gray-850 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-black border border-gray-700 rounded px-2.5 py-1 text-center font-mono text-xs font-black text-white tracking-widest uppercase">
                          {vehicle.plate}
                        </div>
                        <div>
                          <h4 className="text-sm font-sans font-black text-white uppercase leading-none">
                            {vehicle.brand} {vehicle.model}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500 self-center">
                            Frotista {sIndex + 1} de {services.length}
                          </span>
                        </div>
                      </div>

                      {/* Remove entire vehicle from current session */}
                      <button
                        type="button"
                        onClick={() => handleRemoveVehicleFromClosure(service.id)}
                        className="p-1.5 text-red-400 hover:text-white hover:bg-red-950/40 rounded transition-colors border border-red-500/10 cursor-pointer flex items-center gap-1 text-[11px] font-mono font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        REMOVER CARRO
                      </button>
                    </div>

                    {/* Technical Parts Section inside Car */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-[#FFC72C]" />
                          Peças Utilizadas
                        </h5>
                        <span className="text-xs font-mono font-bold text-gray-400">
                          Subtotal Peças: <strong className="text-white">{formatCurrency(partsSub)}</strong>
                        </span>
                      </div>

                      {/* Add individual Piece Form */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-black/40 border border-gray-850 rounded-lg">
                        <div className="sm:col-span-6 space-y-0.5">
                          <input
                            type="text"
                            placeholder="Nome / Descrição da peça"
                            value={tempPartName[service.id] || ''}
                            onChange={(e) => setTempPartName({ ...tempPartName, [service.id]: e.target.value })}
                            className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] rounded-md p-2 outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-0.5">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={tempPartQty[service.id] || ''}
                            onChange={(e) => setTempPartQty({ ...tempPartQty, [service.id]: Number(e.target.value) })}
                            className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] rounded-md p-2 outline-none font-mono"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-0.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Valor R$"
                            value={tempPartPrice[service.id] || ''}
                            onChange={(e) => setTempPartPrice({ ...tempPartPrice, [service.id]: Number(e.target.value) })}
                            className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] rounded-md p-2 outline-none font-mono"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleAddPartItem(service.id)}
                            className="w-full h-full bg-[#FFC72C] hover:bg-[#E0A81C] text-black rounded-md flex items-center justify-center cursor-pointer font-bold"
                            title="Inserir Peça na Lista"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Display added parts list */}
                      {service.parts.length === 0 ? (
                        <p className="text-[11px] font-mono text-gray-500 py-1 italic">Nenhuma peça cadastrada para este carro.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs font-mono">
                            <thead>
                              <tr className="border-b border-gray-850 text-gray-500 text-[10px]">
                                <th className="py-2">DESCRIÇÃO PEÇA</th>
                                <th className="py-2 text-center w-16">QTD</th>
                                <th className="py-2 text-right w-28">VALOR UNIT.</th>
                                <th className="py-2 text-right w-28">VALOR TOTAL</th>
                                <th className="py-2 text-center w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {service.parts.map((p) => (
                                <tr key={p.id} className="border-b border-gray-850/50 text-gray-300 hover:text-white">
                                  <td className="py-2 font-bold">{p.name}</td>
                                  <td className="py-2 text-center">{p.quantity}</td>
                                  <td className="py-2 text-right">{formatCurrency(p.unitPrice)}</td>
                                  <td className="py-2 text-right text-white font-bold">{formatCurrency(p.quantity * p.unitPrice)}</td>
                                  <td className="py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePartItem(service.id, p.id)}
                                      className="text-red-400 hover:text-red-500 cursor-pointer"
                                      title="Remover peça"
                                    >
                                      <X className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Mão de Obra e Descontos (ONLY parts) parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-850">
                      
                      {/* Labor details */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                          🛠️ Descrição Serviço & Mão de Obra
                        </label>
                        <textarea
                          placeholder="Descrição detalhada das reparações de mão de obra..."
                          rows={2}
                          className="w-full text-xs text-white bg-black/40 border border-gray-800 rounded-lg p-2 outline-none font-sans"
                          value={service.laborDescription}
                          onChange={(e) => handleLaborDescriptionChange(service.id, e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-gray-400">VALOR MÃO DE OBRA:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Mão de obra R$"
                            className="w-28 text-xs text-white bg-black/40 border border-gray-800 rounded-md p-1 outline-none font-mono text-right font-bold focus:border-[#FFC72C]"
                            value={service.laborPrice || ''}
                            onChange={(e) => handleLaborPriceChange(service.id, Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Discount inputs */}
                      <div className="space-y-4 bg-black/30 p-3.5 rounded-lg border border-gray-850">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest flex items-center gap-1">
                            <BadgePercent className="w-4 h-4 text-yellow-500" />
                            Previsão de Desconto (Aplica nas Peças)
                          </label>
                        </div>

                        {/* Row: discount configuration buttons */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex rounded-md overflow-hidden border border-gray-800">
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(service.id, 'percentage', service.discountValue)}
                              className={`px-3 py-1 text-[10px] font-mono font-bold ${
                                service.discountType === 'percentage'
                                  ? 'bg-[#FFC72C] text-black'
                                  : 'bg-[#1C1D20] text-gray-400'
                              }`}
                            >
                              % COMPRA
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDiscountChange(service.id, 'fixed', service.discountValue)}
                              className={`px-3 py-1 text-[10px] font-mono font-bold ${
                                service.discountType === 'fixed'
                                  ? 'bg-[#FFC72C] text-black'
                                  : 'bg-[#1C1D20] text-gray-400'
                              }`}
                            >
                              VALOR R$
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">DEDUÇÃO:</span>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-20 text-xs text-white bg-black/50 border border-gray-800 rounded p-1 outline-none font-mono text-right focus:border-[#FFC72C]"
                              value={service.discountValue || ''}
                              onChange={(e) => handleDiscountChange(service.id, service.discountType, Number(e.target.value))}
                            />
                            <span className="text-xs font-mono font-bold text-gray-400">
                              {service.discountType === 'percentage' ? '%' : 'R$'}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] font-mono text-gray-400 leading-none pt-1">
                          <span>Desconto Calculado:</span>
                          <span className="text-[#FFC72C] font-bold">-{formatCurrency(partsDisc)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Single Vehicle Totalizer block */}
                    <div className="p-3 bg-black border border-gray-850 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs font-mono">
                      <div className="flex flex-wrap items-center gap-3 mb-2 sm:mb-0">
                        <span className="text-gray-400">Resumo:</span>
                        <span className="text-gray-300">Peças: {formatCurrency(partsSub)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-red-400">Desc: -{formatCurrency(partsDisc)}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-300">M. Obra: {formatCurrency(service.laborPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 mr-2 font-bold uppercase tracking-wider text-[10px]">SUBTOTAL VEÍCULO:</span>
                        <span className="text-sm font-sans font-black text-[#FFC72C]">{formatCurrency(vTotal)}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </form>
  );
}
