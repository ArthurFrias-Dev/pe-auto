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
  Car, 
  Calendar, 
  Milestone, 
  FileText, 
  X, 
  Building,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { generateId } from '../lib/db';

interface VehiclesManagerProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export default function VehiclesManager({ state, onUpdateState }: VehiclesManagerProps) {
  const { companies, vehicles } = state;

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form Fields
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [mileage, setMileage] = useState<number>(0);
  const [companyId, setCompanyId] = useState('');
  const [notes, setNotes] = useState('');

  // Local feedback alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered List
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Company match
      if (selectedCompanyFilter && v.companyId !== selectedCompanyFilter) return false;

      // Text match
      const searchLower = searchTerm.toLowerCase();
      const compName = companies.find(c => c.id === v.companyId)?.name.toLowerCase() || '';
      return (
        v.plate.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower) ||
        v.brand.toLowerCase().includes(searchLower) ||
        compName.includes(searchLower)
      );
    });
  }, [vehicles, companies, searchTerm, selectedCompanyFilter]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setPlate('');
    setModel('');
    setBrand('');
    setYear(new Date().getFullYear());
    setMileage(0);
    setCompanyId(companies[0]?.id || '');
    setNotes('');
    setIsModalOpen(true);
    setAlert(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setPlate(vehicle.plate);
    setModel(vehicle.model);
    setBrand(vehicle.brand);
    setYear(vehicle.year);
    setMileage(vehicle.mileage);
    setCompanyId(vehicle.companyId);
    setNotes(vehicle.notes);
    setIsModalOpen(true);
    setAlert(null);
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plate.trim()) {
      triggerAlert('error', 'A placa do veículo é obrigatória.');
      return;
    }
    if (!model.trim() || !brand.trim()) {
      triggerAlert('error', 'Marca e modelo são obrigatórios.');
      return;
    }
    if (!companyId) {
      triggerAlert('error', 'É obrigatório selecionar uma empresa proprietária.');
      return;
    }

    // Plate Normalization e.g. ABC1D23 or ABC-1234
    const formattedPlate = plate.trim().toUpperCase();

    if (editingVehicle) {
      // Update
      const updatedList = vehicles.map(v => {
        if (v.id === editingVehicle.id) {
          return {
            ...v,
            plate: formattedPlate,
            model: model.trim(),
            brand: brand.trim(),
            year: Number(year),
            mileage: Number(mileage),
            companyId,
            notes: notes.trim(),
          };
        }
        return v;
      });

      const nextState = { ...state, vehicles: updatedList };
      onUpdateState(nextState);
      triggerAlert('success', `Veículo "${formattedPlate}" atualizado com sucesso!`);
      setIsModalOpen(false);
    } else {
      // Check for plate duplicate
      const duplicate = vehicles.find(v => v.plate.toUpperCase() === formattedPlate);
      if (duplicate) {
        triggerAlert('error', `A placa "${formattedPlate}" já está cadastrada no sistema.`);
        return;
      }

      // Create
      const newVehicle: Vehicle = {
        id: generateId('v'),
        companyId,
        plate: formattedPlate,
        model: model.trim(),
        brand: brand.trim(),
        year: Number(year),
        mileage: Number(mileage),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextState = {
        ...state,
        vehicles: [newVehicle, ...vehicles],
      };
      onUpdateState(nextState);
      triggerAlert('success', `Veículo "${formattedPlate}" cadastrado com sucesso!`);
      setIsModalOpen(false);
    }
  };

  // Delete Handler
  const handleDelete = (vehicle: Vehicle) => {
    // Check if there is active O.S. containing this vehicle?
    const connectedOrdersCount = state.serviceOrders.filter(so => 
      so.services.some(srv => srv.vehicleId === vehicle.id)
    ).length;

    let confirmMsg = `Tem certeza que deseja remover o veículo "${vehicle.model} - Placa: ${vehicle.plate}"?`;
    if (connectedOrdersCount > 0) {
      confirmMsg += `\n\nATENÇÃO: Este veículo possui ${connectedOrdersCount} registros no histórico de Ordens de Serviço. Sua exclusão pode afetar os relatórios impressos históricos.`;
    }

    if (window.confirm(confirmMsg)) {
      const updatedList = vehicles.filter(v => v.id !== vehicle.id);
      const nextState = { ...state, vehicles: updatedList };
      onUpdateState(nextState);
      triggerAlert('success', 'Veículo removido com sucesso.');
    }
  };

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Sem empresa vinculada';
  };

  return (
    <div className="space-y-6">
      {/* Header and Add section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-white uppercase">
            CADASTRO DE <span className="text-[#FFC72C]">VEÍCULOS DE FROTA</span>
          </h2>
          <p className="text-gray-400 text-xs">
            Gerencie os carros, vans e caminhões associados às empresas parceiras.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          disabled={companies.length === 0}
          className="px-4 py-2 text-xs font-mono font-bold tracking-wider bg-[#FFC72C] hover:bg-[#E0A81C] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black rounded-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          REGISTRAR VEÍCULO
        </button>
      </div>

      {companies.length === 0 && (
        <div className="p-4 rounded-lg bg-yellow-950/20 text-[#FFC72C] border border-yellow-500/30 text-xs font-mono">
          ⚠️ Antes de cadastrar um veículo, você precisa cadastrar pelo menos uma <strong>Empresa Parceira</strong> para vinculação.
        </div>
      )}

      {/* Local Flash Feedback Alerts */}
      {alert && (
        <div className={`p-4 rounded-lg flex items-center gap-3 border ${
          alert.type === 'error' 
            ? 'bg-red-950/20 text-red-500 border-red-500/30' 
            : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
        }`}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-mono font-bold">{alert.text}</span>
        </div>
      )}

      {/* Grid Filter / Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search text */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Pesquisar por Placa, Modelo, Marca ou Empresa proprietária..."
            className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg pl-10 pr-4 py-3 outline-none font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Selected company filter drop */}
        <div className="flex gap-2">
          <select
            className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
          >
            <option value="">Filtrar: Todas as Empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedCompanyFilter && (
            <button
              onClick={() => setSelectedCompanyFilter('')}
              className="p-3 bg-gray-850 hover:bg-gray-800 text-gray-400 rounded-lg transition-colors cursor-pointer"
              title="Limpar filtro de empresa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Display Cards */}
      {filteredVehicles.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-gray-800 bg-[#131416]/50">
          <Car className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-300 font-mono">Nenhum veículo encontrado</h3>
          <p className="text-xs text-gray-500 mt-1">Nenhum veículo corresponde à sua busca ou filtro corporativo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div 
              key={vehicle.id}
              className="group rounded-xl border border-gray-850 bg-[#131416] hover:bg-[#181a1d] hover:border-yellow-500/30 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="space-y-0.5">
                    {/* Visual Plate badge styling resembles real License plate */}
                    <div className="inline-flex flex-col border border-gray-700 rounded overflow-hidden shadow-sm">
                      <div className="bg-blue-600 font-sans font-extrabold text-[7px] text-white text-center py-0.5 px-3 uppercase tracking-widest leading-none">
                        BRASIL
                      </div>
                      <div className="bg-white text-black font-mono font-black text-xs py-0.5 px-3 tracking-widest text-center">
                        {vehicle.plate}
                      </div>
                    </div>
                    <h4 className="text-sm font-sans font-black text-white group-hover:text-[#FFC72C] transition-colors uppercase pt-2">
                      {vehicle.brand} {vehicle.model}
                    </h4>
                  </div>
                  <div className="p-2 rounded bg-black border border-gray-800 text-yellow-500">
                    <Car className="w-5 h-5" />
                  </div>
                </div>

                {/* Company Owner badge */}
                <div className="flex items-center gap-1.5 py-1 px-2.5 rounded bg-[#1C1D20] text-[11px] text-gray-300 font-semibold mb-4">
                  <Building className="w-3.5 h-3.5 text-[#FFC72C]" />
                  <span className="truncate">{getCompanyName(vehicle.companyId)}</span>
                </div>

                {/* Technical data attributes */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800/45 text-xs font-mono text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-[9px] text-gray-500 leading-none">ANO/MODELO</p>
                      <span className="text-white font-bold">{vehicle.year}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Milestone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-[9px] text-gray-500 leading-none">QUILOMETRAGEM</p>
                      <span className="text-white font-bold">
                        {vehicle.mileage.toLocaleString('pt-BR')} km
                      </span>
                    </div>
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="mt-4 p-2.5 rounded bg-black/40 text-gray-400 text-[11px] font-mono flex items-start gap-1.5 border-l-2 border-yellow-500/60">
                    <FileText className="w-3.5 h-3.5 mt-0.5 text-yellow-500 flex-shrink-0" />
                    <span className="line-clamp-2">{vehicle.notes}</span>
                  </div>
                )}
              </div>

              {/* Action Operations elements */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-gray-850 justify-end">
                <button
                  onClick={() => handleOpenEditModal(vehicle)}
                  className="p-2 rounded bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  title="Editar dados do veículo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(vehicle)}
                  className="p-2 rounded bg-red-950/20 hover:bg-red-650 hover:text-white text-red-400 border border-red-500/10 transition-colors cursor-pointer"
                  title="Remover veículo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create or Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-xl border border-gray-800 bg-[#131416] shadow-2xl overflow-hidden">
            {/* Modal Title bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#1A1C1F]">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#FFC72C]" />
                <h3 className="text-sm font-sans font-black text-white tracking-widest uppercase">
                  {editingVehicle ? 'EDITAR VEÍCULO' : 'CADASTRAR VEÍCULO'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form layout */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plate */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Placa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC1D23 ou FLO-9888"
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-mono uppercase"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                  />
                </div>

                {/* Owner Company Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Empresa Proprietária <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                  >
                    <option value="" disabled>Selecione uma empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Hyundai, Fiat, Scania"
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                {/* Model */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: HR 2.5 Turbo, Toro, Sprinter"
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Production Year */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Ano de Fabricação
                  </label>
                  <input
                    type="number"
                    min={1920}
                    max={new Date().getFullYear() + 2}
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-mono"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>

                {/* Mileage */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                    Quilometragem Inicial (km)
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-mono"
                    value={mileage}
                    onChange={(e) => setMileage(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Maintenance history general note */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase font-black tracking-widest">
                  Observações Técnicas / Restrições do veículo
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Veículo roda em estrada de terra constantemente, usar amortecedor blindado..."
                  className="w-full text-xs text-white bg-[#1C1D20] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg p-3 outline-none font-sans"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              {/* Action Buttons */}
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
                  {editingVehicle ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR VEÍCULO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
