/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Company, Vehicle, ServiceOrder, VehicleService, AppState } from '../types';
import { 
  Search, 
  Clock, 
  CheckCircle, 
  Printer, 
  FileSpreadsheet, 
  Edit, 
  Trash2, 
  Building, 
  Car, 
  User, 
  SlidersHorizontal,
  ChevronRight,
  Receipt,
  FileText,
  BadgeAlert,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import { 
  formatCurrency, 
  calculatePartsSubtotal, 
  calculatePartsDiscount, 
  calculateVehicleTotal, 
  calculateServiceOrderGrandTotals 
} from '../lib/db';

interface HistoryViewerProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onEditOrder: (orderId: string) => void;
  selectedOrderId: string | null;
  onSelectOrder: (orderId: string | null) => void;
}

export default function HistoryViewer({ 
  state, 
  onUpdateState, 
  onEditOrder,
  selectedOrderId,
  onSelectOrder
}: HistoryViewerProps) {
  const { companies, vehicles, serviceOrders } = state;

  const workshopDetails = state.workshopDetails || {
    name: 'PEÇAUTO',
    subtitle: 'Apex Autopeças & Serviços Automotivos',
    address: 'Rua da Embreagem Mecânica, 3000 • São Paulo, SP',
    phone: '(11) 5555-4444',
    cnpj: '12.345.678/0001-00'
  };

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'budget' | 'closed'>('all');
  const [companyFilter, setCompanyFilter] = useState('');

  // Selected Order for the "Tela de Resumo Final"
  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return serviceOrders.find(so => so.id === selectedOrderId) || null;
  }, [selectedOrderId, serviceOrders]);

  // Combined fast search filtering logic
  const filteredOrders = useMemo(() => {
    return serviceOrders.filter(order => {
      // Status Match
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;

      // Company Match
      if (companyFilter && order.companyId !== companyFilter) return false;

      // Text Search matches title, company name, or vehicle plate numbers (Very fast and useful)
      const queryLower = searchQuery.toLowerCase();
      if (!queryLower) return true;

      const orderTitle = order.title.toLowerCase();
      const compName = companies.find(c => c.id === order.companyId)?.name.toLowerCase() || '';
      
      const plateMatches = order.services.some(srv => {
        const v = vehicles.find(veh => veh.id === srv.vehicleId);
        return v ? v.plate.toLowerCase().includes(queryLower) || v.model.toLowerCase().includes(queryLower) : false;
      });

      return orderTitle.includes(queryLower) || compName.includes(queryLower) || plateMatches;
    });
  }, [serviceOrders, companies, vehicles, searchQuery, statusFilter, companyFilter]);

  // Calculations details
  const activeOrderTotals = useMemo(() => {
    if (!activeOrder) return null;
    return calculateServiceOrderGrandTotals(activeOrder);
  }, [activeOrder]);

  const getCompanyDetails = (companyId: string): Company => {
    return companies.find(c => c.id === companyId) || {
      id: '',
      name: 'Empresa Indefinida',
      phone: 'N/A',
      notes: '',
      createdAt: ''
    };
  };

  const getVehicleDetails = (vehicleId: string): Vehicle => {
    return vehicles.find(v => v.id === vehicleId) || {
      id: '',
      companyId: '',
      plate: 'N/A',
      model: 'Desconhecido',
      brand: 'Desconhecido',
      year: 0,
      mileage: 0,
      notes: '',
      createdAt: ''
    };
  };

  // Delete matching O.S. records
  const handleDeleteOrder = (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm("Atenção: Tem certeza que deseja remover esta Ordem de Serviço permanentemente dos registros locais?")) {
      const updatedList = serviceOrders.filter(so => so.id !== orderId);
      onUpdateState({
        ...state,
        serviceOrders: updatedList
      });
      if (selectedOrderId === orderId) {
        onSelectOrder(null);
      }
    }
  };

  // Print Invoice Sheet via browser mechanism and jsPDF download fallback
  const handlePrint = () => {
    if (!activeOrder) return;

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const company = getCompanyDetails(activeOrder.companyId);
      const totals = calculateServiceOrderGrandTotals(activeOrder);

      // Page parameters
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = 15;

      // Helper function to check vertical space and add page if needed
      const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      // Header Banner
      doc.setFillColor(20, 21, 23); // dark gray (#141517)
      doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');

      // Title text inside banner
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(workshopDetails.name.toUpperCase(), margin + 5, y + 9);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(workshopDetails.subtitle, margin + 5, y + 15);
      doc.text(workshopDetails.address, margin + 5, y + 20);

      // Invoice info right-side inside banner
      doc.setTextColor(255, 199, 44); // yellow #FFC72C
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const statusText = activeOrder.status === 'closed' ? 'FATURAMENTO CONCLUIDO' : 'ORCAMENTO EM ABERTO';
      doc.text(statusText, pageWidth - margin - 5, y + 8, { align: 'right' });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(activeOrder.title.toUpperCase(), pageWidth - margin - 5, y + 13, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Emissao: ${new Date(activeOrder.createdAt).toLocaleDateString('pt-BR')}`, pageWidth - margin - 5, y + 18, { align: 'right' });
      doc.text(`ID O.S.: #${activeOrder.id}`, pageWidth - margin - 5, y + 22, { align: 'right' });

      y += 28;

      // Corporate Client Details Box
      checkPageBreak(35);
      doc.setFillColor(245, 246, 248); // light off-white background
      doc.rect(margin, y, pageWidth - 2 * margin, 32, 'F');
      doc.setDrawColor(220, 222, 225);
      doc.rect(margin, y, pageWidth - 2 * margin, 32, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 120);
      doc.text("EMPRESA FATURADA", margin + 6, y + 6);
      doc.text("REGISTRO CNPJ", margin + 70, y + 6);
      doc.text("TELEFONE", margin + 130, y + 6);

      doc.setFontSize(10);
      doc.setTextColor(20, 20, 23);
      doc.text(company.name.toUpperCase(), margin + 6, y + 12);
      doc.text(company.cnpj ? company.cnpj : 'Inexistente', margin + 70, y + 12);
      doc.text(company.phone ? company.phone : 'N/A', margin + 130, y + 12);

      if (company.notes) {
        doc.setDrawColor(230, 230, 235);
        doc.line(margin + 5, y + 16, pageWidth - margin - 5, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(80, 90, 100);
        doc.text(`Observações Faturamento: ${company.notes}`, margin + 6, y + 22, { maxWidth: pageWidth - 2 * margin - 12 });
      }

      y += 38;

      // Section: Detalhamento dos Veículos
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 23);
      doc.text("DETALHAMENTO DOS VEICULOS E MAO DE OBRA", margin, y);
      y += 4;
      doc.setDrawColor(255, 199, 44);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineWidth(0.1); // reset line width
      y += 6;

      if (activeOrder.services.length === 0) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text("Nenhum veiculo listado nesta ordem de servico.", margin, y);
        y += 8;
      } else {
        activeOrder.services.forEach((srv, idx) => {
          const veh = getVehicleDetails(srv.vehicleId);
          const pSub = calculatePartsSubtotal(srv.parts);
          const pDisc = calculatePartsDiscount(srv.parts, srv.discountType, srv.discountValue);
          const vTotal = calculateVehicleTotal(srv);

          // Render vehicle header box
          checkPageBreak(40);
          doc.setFillColor(235, 237, 240);
          doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(20, 20, 23);
          doc.text(`${idx + 1}. ${veh.brand} ${veh.model}`.toUpperCase(), margin + 4, y + 5.5);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(`PLACA: ${veh.plate}`, margin + 80, y + 5.5);
          doc.text(`ANO: ${veh.year || 'N/A'}  Odom.: ${veh.mileage?.toLocaleString('pt-BR') || '0'} km`, pageWidth - margin - 4, y + 5.5, { align: 'right' });
          y += 12;

          // Parts table header
          checkPageBreak(15);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text("MATERIAIS E AUTOPRECAS", margin + 4, y);
          y += 4;
          
          doc.setDrawColor(210, 212, 215);
          doc.line(margin + 4, y, pageWidth - margin - 4, y);
          y += 4;

          if (srv.parts.length === 0) {
            checkPageBreak(8);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            doc.setTextColor(140, 140, 140);
            doc.text("Nenhuma autopecas ou material adicionado para este veiculo.", margin + 6, y);
            y += 6;
          } else {
            // Header columns
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);
            doc.text("DESCRITIVO DA PECA / FLUIDO / COMPONENTE", margin + 6, y);
            doc.text("QTD", margin + 110, y, { align: 'center' });
            doc.text("UNITARIO", margin + 140, y, { align: 'right' });
            doc.text("SUBTOTAL", pageWidth - margin - 6, y, { align: 'right' });
            y += 4;
            doc.line(margin + 4, y, pageWidth - margin - 4, y);
            y += 3;

            srv.parts.forEach((p) => {
              checkPageBreak(8);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(50, 50, 50);
              doc.text(p.name, margin + 6, y);
              doc.text(String(p.quantity), margin + 110, y, { align: 'center' });
              doc.text(formatCurrency(p.unitPrice), margin + 140, y, { align: 'right' });
              doc.setFont('helvetica', 'bold');
              doc.text(formatCurrency(p.quantity * p.unitPrice), pageWidth - margin - 6, y, { align: 'right' });
              y += 5.5;
            });
            y += 2;
          }

          // Labor and Vehicle computation box
          checkPageBreak(28);
          doc.setDrawColor(220, 222, 225);
          doc.line(margin + 4, y, pageWidth - margin - 4, y);
          y += 4;

          // Draw double-column: Labor info and Financial box inside vehicle
          const laborTopY = y;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(120, 120, 120);
          doc.text("MAO DE OBRA E SERVICOS EXECUTADOS", margin + 4, y);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(50, 50, 50);
          const laborDesc = srv.laborDescription || "Verificacao e assistencia tecnica geral nos conformes operacionais.";
          const laborLines = doc.splitTextToSize(laborDesc, 110);
          doc.text(laborLines, margin + 4, y + 4.5);

          // Vehicle financial summary card
          const finBoxX = margin + 120;
          const finBoxWidth = pageWidth - margin - finBoxX;
          doc.setFillColor(248, 249, 250);
          doc.rect(finBoxX, laborTopY, finBoxWidth, 22, 'F');
          doc.rect(finBoxX, laborTopY, finBoxWidth, 22, 'D');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 100, 100);
          doc.text("Subtotal Pecas:", finBoxX + 3, laborTopY + 4.5);
          doc.text(formatCurrency(pSub), pageWidth - margin - 3, laborTopY + 4.5, { align: 'right' });

          doc.setTextColor(180, 50, 50);
          doc.text("(-) Descontos:", finBoxX + 3, laborTopY + 9.5);
          doc.text(`-${formatCurrency(pDisc)}`, pageWidth - margin - 3, laborTopY + 9.5, { align: 'right' });

          doc.setTextColor(100, 100, 100);
          doc.text("(+) Mao de Obra:", finBoxX + 3, laborTopY + 14.5);
          doc.text(formatCurrency(srv.laborPrice), pageWidth - margin - 3, laborTopY + 14.5, { align: 'right' });

          doc.setDrawColor(200, 200, 205);
          doc.line(finBoxX + 2, laborTopY + 17, pageWidth - margin - 2, laborTopY + 17);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(20, 20, 23);
          doc.text("TOTAL VEICULO:", finBoxX + 3, laborTopY + 20.5);
          doc.text(formatCurrency(vTotal), pageWidth - margin - 3, laborTopY + 20.5, { align: 'right' });

          y = Math.max(y + 22, y + (laborLines.length * 4) + 6);
          y += 8; // Spacing after each vehicle card
        });
      }

      // Notes and recommendations
      if (activeOrder.observations) {
        checkPageBreak(25);
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, y, pageWidth - 2 * margin, 18, 'F');
        doc.setDrawColor(230, 230, 235);
        doc.rect(margin, y, pageWidth - 2 * margin, 18, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text("NOTAS FINAIS E RECOMENDACOES TECNICAS", margin + 4, y + 4.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        const obsLines = doc.splitTextToSize(activeOrder.observations, pageWidth - 2 * margin - 8);
        doc.text(obsLines, margin + 4, y + 9);
        y += 24;
      }

      // Grand totals card
      if (totals) {
        checkPageBreak(26);
        doc.setFillColor(20, 21, 23); // matching real dark plate
        doc.rect(margin, y, pageWidth - 2 * margin, 20, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(210, 210, 210);
        doc.text(`Pecas S/D: ${formatCurrency(totals.partsSubtotal)}`, margin + 6, y + 8);
        doc.text(`Descontos Pecas: -${formatCurrency(totals.discountTotal)}`, margin + 6, y + 14);
        doc.text(`Mão de Obra Total: ${formatCurrency(totals.laborTotal)}`, margin + 65, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 199, 44);
        doc.text("VALOR DE COBRANCA CORPORATIVO", pageWidth - margin - 6, y + 6.5, { align: 'right' });
        doc.setFontSize(15);
        doc.text(formatCurrency(totals.grandTotal), pageWidth - margin - 6, y + 14.5, { align: 'right' });

        y += 28;
      }

      // Signatures
      checkPageBreak(32);
      y += 5;
      doc.setDrawColor(200, 202, 205);
      // Signature lines
      doc.line(margin + 10, y + 12, margin + 70, y + 12);
      doc.line(pageWidth - margin - 70, y + 12, pageWidth - margin - 10, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text("ASSINATURA RESPONSAVEL FROTA", margin + 40, y + 16, { align: 'center' });
      doc.text("CARIMBO OFICINA / RESPONSAVEL", pageWidth - margin - 40, y + 16, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      doc.text("Empresa Credenciada", margin + 40, y + 20, { align: 'center' });
      doc.text(`${workshopDetails.name} Gestor de Oficina`, pageWidth - margin - 40, y + 20, { align: 'center' });

      // Footer notice
      y += 24;
      checkPageBreak(12);
      doc.setDrawColor(235, 235, 237);
      doc.line(margin, y, pageWidth - margin, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(`Obrigado pela parceria! Faturamento gerado de forma segura no banco de dados local ${workshopDetails.name}.`, pageWidth / 2, y + 4, { align: 'center' });
      doc.text(`Operado em ${new Date(activeOrder.updatedAt).toLocaleString('pt-BR')} por Administrador. Documento Oficial ${workshopDetails.name}.`, pageWidth / 2, y + 7.5, { align: 'center' });

      // Save document
      doc.save(`${workshopDetails.name.toLowerCase().replace(/\s+/g, '_')}_faturamento_${activeOrder.id}.pdf`);
    } catch (error) {
      console.error("Critical error generating PDF using jsPDF:", error);
      window.print();
    }
  };

  // Export spreadsheet integration (simulated via CSV string download)
  const handleExportCSV = () => {
    if (!activeOrder) return;
    const company = getCompanyDetails(activeOrder.companyId);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Ordem de Servico:;${activeOrder.title}\n`;
    csvContent += `Empresa:;${company.name};CNPJ:;${company.cnpj || ''}\n`;
    csvContent += `Status:;${activeOrder.status === 'closed' ? 'Faturamento Fechado' : 'Orcamento'}\n`;
    csvContent += `Criado em:;${new Date(activeOrder.createdAt).toLocaleDateString('pt-BR')}\n\n`;

    csvContent += "Placa Veiculo;Marca;Modelo;Km;Peca;Qtd;Unitario;Desconto;Mao Obra;Total Veiculo\n";

    activeOrder.services.forEach(s => {
      const v = getVehicleDetails(s.vehicleId);
      const vTotal = calculateVehicleTotal(s);
      const partsDisc = calculatePartsDiscount(s.parts, s.discountType, s.discountValue);
      
      if (s.parts.length === 0) {
        csvContent += `"${v.plate}";"${v.brand}";"${v.model}";${v.mileage};"Nenhuma";0;0.00;${partsDisc};${s.laborPrice};${vTotal}\n`;
      } else {
        s.parts.forEach((p, idx) => {
          if (idx === 0) {
            csvContent += `"${v.plate}";"${v.brand}";"${v.model}";${v.mileage};"${p.name}";${p.quantity};${p.unitPrice};${partsDisc};${s.laborPrice};${vTotal}\n`;
          } else {
            csvContent += `;;;;"${p.name}";${p.quantity};${p.unitPrice};;;\n`;
          }
        });
      }
    });

    const totals = calculateServiceOrderGrandTotals(activeOrder);
    csvContent += `\n;;;;;;;TOTAL PEÇAS:;${totals.partsSubtotal}\n`;
    csvContent += `;;;;;;;DESCONTOS:;-${totals.discountTotal}\n`;
    csvContent += `;;;;;;;TOTAL MÃO DE OBRA:;${totals.laborTotal}\n`;
    csvContent += `;;;;;;;TOTAL GERAL FINAL:;${totals.grandTotal}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${workshopDetails.name.toLowerCase().replace(/\s+/g, '_')}_faturamento_${activeOrder.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic CSS wrapper for isolated printing layout */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: white !important;
            color: black !important;
          }
          #print-invoice-area, #print-invoice-area * {
            visibility: visible;
          }
          #print-invoice-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          /* Ensure headers and numbers are fully readable in black/white prints */
          span, p, h1, h2, h3, h4, h5, td, th {
            color: #000000 !important;
          }
          .custom-border-print {
            border: 1px solid #000 !important;
          }
        }
      `}</style>

      {/* Main split dashboard view or isolated detailed view */}
      {activeOrder ? (
        /* Screen: Detailed "Tela de Resumo Final" */
        <div className="space-y-6">
          <div className="flex items-center justify-between no-print">
            <button
              onClick={() => onSelectOrder(null)}
              className="px-4 py-2 text-xs font-mono font-bold text-[#FFC72C] bg-gray-850 hover:bg-black border border-gray-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              VOLTAR HISTÓRICO
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-xs font-mono font-bold text-gray-300 bg-[#16171a] border border-gray-800 hover:border-gray-600 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                CSV EXCEL
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-mono font-bold text-black bg-[#FFC72C] hover:bg-[#E0A81C] rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                IMPRIMIR / PDF
              </button>
            </div>
          </div>

          {/* Core Invoice Summary Plate: PRINTABLE CONTAINER */}
          <div 
            id="print-invoice-area" 
            className="rounded-xl border border-gray-800 bg-[#111214] p-6 md:p-8 space-y-6 shadow-xl"
          >
            {/* Print Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-800 pb-6 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-[#FFC72C] no-print" />
                  <span className="font-sans font-black tracking-wider text-xl text-white uppercase select-none">
                    {workshopDetails.name.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">{workshopDetails.subtitle}</p>
                <p className="text-[10px] text-gray-500 font-mono">{workshopDetails.address}</p>
              </div>

              <div className="text-right space-y-1 font-mono">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeOrder.status === 'closed'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-yellow-500/10 text-[#FFC72C] border border-yellow-500/30'
                }`}>
                  {activeOrder.status === 'closed' ? 'Faturamento Concluído' : 'Orçamento em Aberto'}
                </span>
                <p className="text-xs text-white font-bold uppercase pt-1">{activeOrder.title}</p>
                <p className="text-[10px] text-gray-400">Emissão: {new Date(activeOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                <p className="text-[10px] text-gray-500">ID O.S.: #{activeOrder.id}</p>
              </div>
            </div>

            {/* Corporate Client Card */}
            {(() => {
              const comp = getCompanyDetails(activeOrder.companyId);
              return (
                <div className="p-4 bg-[#18191c] border border-gray-800/60 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-gray-300">
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 leading-none">EMPRESA FATURADA</p>
                    <p className="text-white font-sans font-black uppercase text-sm mt-1">{comp.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 leading-none">REGISTRO CNPJ</p>
                    <p className="text-gray-200 font-bold mt-1">{comp.cnpj || 'Inexistente'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-gray-500 leading-none">TELEFONE DE CONTATO</p>
                    <p className="text-gray-200 font-bold mt-1">{comp.phone || 'N/A'}</p>
                  </div>
                  {comp.notes && (
                    <div className="md:col-span-3 pt-2 text-[10px] text-gray-400 border-t border-gray-800/40">
                      <strong>Observações Faturamento:</strong> {comp.notes}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Vehicles billing line roster list */}
            <div className="space-y-6">
              <h4 className="text-xs font-mono font-black text-[#FFC72C] uppercase tracking-widest border-b border-gray-800 pb-2">
                DETALHAMENTO DOS VEÍCULOS E MÃO DE OBRA
              </h4>

              {activeOrder.services.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono">Nenhum veículo listado.</p>
              ) : (
                activeOrder.services.map((srv, index) => {
                  const veh = getVehicleDetails(srv.vehicleId);
                  const pSub = calculatePartsSubtotal(srv.parts);
                  const pDisc = calculatePartsDiscount(srv.parts, srv.discountType, srv.discountValue);
                  const vTotal = calculateVehicleTotal(srv);

                  return (
                    <div key={srv.id} className="p-4 bg-black/40 border border-gray-850 rounded-lg space-y-4">
                      {/* Vehicle summary badge header */}
                      <div className="flex flex-col sm:flex-row justify-between items-baseline border-b border-gray-850 pb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-[#FFC72C]/10 text-[#FFC72C] flex items-center justify-center font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="text-white font-sans font-extrabold uppercase text-xs">
                            {veh.brand} {veh.model}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-850 font-mono text-[10px] text-white font-bold select-none">
                            PLACA: {veh.plate}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-500">
                          {veh.year && `Ano ${veh.year}`} • Odômetro: {veh.mileage?.toLocaleString('pt-BR')} km
                        </span>
                      </div>

                      {/* Parts Itemized table inside this Car group */}
                      <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 font-mono font-black uppercase">Materiais e Autopeças Utilizadas</p>
                        {srv.parts.length === 0 ? (
                          <p className="text-[11px] text-gray-500 font-mono italic">Nenhum item de peça aplicado neste veículo.</p>
                        ) : (
                          <table className="w-full text-[11px] font-mono border-collapse text-left text-gray-300">
                            <thead>
                              <tr className="border-b border-gray-800 text-gray-500 text-[9px]">
                                <th className="py-1">MECÂNICO/PEÇA</th>
                                <th className="py-1 text-center w-14">QUANT</th>
                                <th className="py-1 text-right w-24">VALOR UNIT.</th>
                                <th className="py-1 text-right w-24">SUBTOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {srv.parts.map((p) => (
                                <tr key={p.id} className="border-b border-gray-850/30">
                                  <td className="py-1.5">{p.name}</td>
                                  <td className="py-1.5 text-center">{p.quantity}</td>
                                  <td className="py-1.5 text-right">{formatCurrency(p.unitPrice)}</td>
                                  <td className="py-1.5 text-right font-black text-white">{formatCurrency(p.quantity * p.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Labor execution panel details inside car */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-[11px] font-mono text-gray-400">
                        <div className="md:col-span-2 space-y-1">
                          <p className="text-[9px] text-gray-500">MÃO DE OBRA - SERVIÇO EXECUTADO</p>
                          <p className="text-gray-300 bg-gray-900/50 p-2 rounded border border-gray-850 leading-relaxed font-sans text-xs">
                            {srv.laborDescription || "Verificação e assistência técnica geral nos conformes operacionais."}
                          </p>
                        </div>

                        {/* Totals computation inside car */}
                        <div className="space-y-1.5 bg-[#17181a]/55 border border-gray-850 p-2.5 rounded text-xs select-none">
                          <div className="flex justify-between">
                            <span className="text-[10px] text-gray-500">Subtotal Peças:</span>
                            <span className="text-gray-300">{formatCurrency(pSub)}</span>
                          </div>
                          <div className="flex justify-between text-red-400">
                            <span className="text-[10px]">(-) Descontos Peças:</span>
                            <span>-{formatCurrency(pDisc)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] text-gray-500">(+) Mão de Obra:</span>
                            <span className="text-gray-300">{formatCurrency(srv.laborPrice)}</span>
                          </div>
                          <div className="pt-1.5 border-t border-gray-800 flex justify-between font-extrabold">
                            <span className="text-[10px] text-[#FFC72C]">TOTAL CARRO:</span>
                            <span className="text-white">{formatCurrency(vTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* General Overall observations */}
            {activeOrder.observations && (
              <div className="p-4 bg-[#141518] rounded-lg border border-gray-800">
                <p className="text-[10px] text-gray-500 font-mono font-black uppercase mb-1">Notas Finais & Recomendações Técnicas</p>
                <p className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{activeOrder.observations}</p>
              </div>
            )}

            {/* Real grand totals financial calculations details block */}
            {activeOrderTotals && (
              <div className="p-5 bg-gradient-to-r from-black via-[#161719] to-black rounded-lg border-2 border-yellow-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between font-mono">
                <div className="space-y-1 text-xs text-gray-400 mb-4 sm:mb-0">
                  <div className="flex gap-2">
                    <span>Peças S/D: <strong className="text-white">{formatCurrency(activeOrderTotals.partsSubtotal)}</strong></span>
                    <span>•</span>
                    <span className="text-red-450">Descontos: <strong className="text-red-450">-{formatCurrency(activeOrderTotals.discountTotal)}</strong></span>
                  </div>
                  <div>
                    <span>Mão de Obra Total: <strong className="text-white">{formatCurrency(activeOrderTotals.laborTotal)}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block leading-none mb-1">VALOR DE COBRANÇA CORPORATIVO</span>
                  <span className="text-2xl font-sans font-black text-[#FFC72C]">
                    {formatCurrency(activeOrderTotals.grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* Print Approval Form placeholder */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-mono text-gray-500 border-t border-gray-850">
              <div className="space-y-1">
                <div className="border-b border-gray-800 mx-auto w-48 h-8"></div>
                <p className="text-[10px] uppercase font-black">ASSINATURA RESPONSÁVEL FROTA</p>
                <p className="text-[9px] text-gray-600">Empresa Credenciada</p>
              </div>
              <div className="space-y-1">
                <div className="border-b border-gray-800 mx-auto w-48 h-8"></div>
                <p className="text-[10px] uppercase font-black">CARIMBO OFICINA / RESPONSÁVEL</p>
                <p className="text-[9px] text-gray-600 font-mono">{workshopDetails.name} Gestor de Oficina</p>
              </div>
            </div>

            {/* Back button printable hidden helper */}
            <div className="pt-4 text-center text-[10px] text-gray-600 font-mono tracking-wider space-y-1 border-t border-gray-850 pb-2">
              <p>Obrigado pela parceria! Faturamento gerado de forma segura no banco de dados local {workshopDetails.name}.</p>
              <p>Operado às {new Date(activeOrder.updatedAt).toLocaleString('pt-BR')} por Administrador.</p>
            </div>

          </div>
        </div>
      ) : (
        /* Screen: List summary workspace with filters and search */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight text-white uppercase col-span-2">
                HISTÓRICO DE <span className="text-[#FFC72C]">SERVIÇOS & FATURAMENTO</span>
              </h2>
              <p className="text-gray-400 text-xs">
                Visualize, pesquise, edite ou imprima relatórios completos das Ordens de Serviço faturadas ou orçadas.
              </p>
            </div>
          </div>

          {/* Quick interactive parameters filters block */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#131416]/40 p-4 rounded-xl border border-gray-850">
            {/* Search text query */}
            <div className="relative md:col-span-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisa rápida por empresa, O.S. ou placa de veículo..."
                className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] focus:ring-1 focus:ring-[#FFC72C] rounded-lg pl-10 pr-4 py-2.5 outline-none font-mono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter by Status */}
            <div>
              <select
                className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] p-2.5 rounded-lg outline-none font-mono"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Documentos: Todos</option>
                <option value="budget">Apenas Orçamentos</option>
                <option value="closed">Apenas Faturados</option>
              </select>
            </div>

            {/* Filter by Company */}
            <div>
              <select
                className="w-full text-xs text-white bg-[#131416] border border-gray-800 focus:border-[#FFC72C] p-2.5 rounded-lg outline-none font-mono"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <option value="">Filtrar: Todas as Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Historic Orders Table list */}
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center border-2 border-dashed border-gray-850 rounded-xl bg-black/40">
              <SlidersHorizontal className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-300 font-mono">Nenhum registro histórico encontrado</h3>
              <p className="text-xs text-gray-500 mt-1">Nenhuma ordem de faturamento corresponde aos filtros ativos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const company = getCompanyDetails(order.companyId);
                const totals = calculateServiceOrderGrandTotals(order);

                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder(order.id)}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#131416] border border-gray-850 hover:border-[#FFC72C]/40 hover:bg-[#18191c] transition-all cursor-pointer gap-4"
                  >
                    {/* Identification left sector */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${
                          order.status === 'closed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-yellow-500/10 text-[#FFC72C] border border-yellow-500/20'
                        }`}>
                          {order.status === 'closed' ? 'Fat. Concluído' : 'Orçamento'}
                        </span>
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase">
                          ID: #{order.id}
                        </h4>
                      </div>

                      <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-[#FFC72C] transition-colors leading-tight">
                        {order.title}
                      </h3>

                      {/* Details row badge description */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-mono">
                        <span className="font-bold text-gray-300 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-gray-500" />
                          {company.name}
                        </span>
                        <span>•</span>
                        <span className="bg-[#1C1D20] text-gray-400 py-0.3 px-2 rounded-full text-[10px] flex items-center gap-1 font-semibold">
                          <Car className="w-3 h-3 text-[#FFC72C]" />
                          {order.services.length} {order.services.length === 1 ? 'veículo' : 'veículos'}
                        </span>
                        <span>•</span>
                        <span>{new Date(order.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Totals and control buttons right sector */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-850 pt-3 md:pt-0">
                      <div className="text-right font-mono">
                        <p className="text-[9px] text-gray-500 font-black tracking-widest leading-none mb-1">TOTAL GERAL</p>
                        <p className="text-base font-black text-white group-hover:text-[#FFC72C] transition-colors">
                          {formatCurrency(totals.grandTotal)}
                        </p>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center gap-2">
                        {/* Quick View */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectOrder(order.id); }}
                          className="p-2 rounded bg-gray-850 hover:bg-gray-800 text-gray-300 transition-colors cursor-pointer"
                          title="Tela de Resumo Final (Imprimir)"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Edit */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditOrder(order.id); }}
                          className="p-2 rounded bg-gray-850 hover:bg-gray-800 text-gray-300 transition-colors cursor-pointer"
                          title="Carregar de volta no editor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="p-2 rounded bg-red-950/20 hover:bg-red-650 hover:text-white text-red-400 border border-red-500/10 transition-colors cursor-pointer"
                          title="Remover do Histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
