'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { MaskedInput, currencyToNumber, numberToCurrency } from '@/components/ui/MaskedInput';
import { readArray } from '@/lib/storage';
import { mockFabricantes, mockModelos } from '@/lib/mockFormData';
import { saveCompleto, ClienteCompleto } from '@/services/clienteService';
import { addStatusCardFromOrcamento } from '@/services/statusService';
import { useRouter } from 'next/navigation';
import AgendaOrcamentoModal from '@/components/agenda/AgendaOrcamentoModal';

type Parceiro = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Equipe = {
  id: string;
  login: string;
  parceiro: string;
  [key: string]: unknown;
};

type Fabricante = {
  id: string;
  nome: string;
  [key: string]: unknown;
};

type Modelo = {
  id: string;
  fabricanteId: string;
  nome: string;
  [key: string]: unknown;
};

type Produto = {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number;
  subtotal: number;
  duracaoMin: number;
};

type TipoOSItem = {
  id: string;
  nome: string;
  preco: number;
  desconto: number;
  tipo: 'servico' | 'produto';
  duracao: number;
};

type TipoOS = {
  id: string;
  nome: string;
  itens: TipoOSItem[];
  [key: string]: unknown;
};

export default function Page() {
  const router = useRouter();
  const [tiposOs, setTiposOs] = useState<TipoOS[]>([]);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [mostrarOpcoes, setMostrarOpcoes] = useState(false);
  
  const [parceiroOptions, setParceiroOptions] = useState<SelectOption[]>([]);
  const [responsavelOptions, setResponsavelOptions] = useState<SelectOption[]>([]);
  const [fabricanteOptions, setFabricanteOptions] = useState<SelectOption[]>([]);
  const [modeloOptions, setModeloOptions] = useState<SelectOption[]>([]);
  const [tipoOptions, setTipoOptions] = useState<SelectOption[]>([]);
  const [itemOptions, setItemOptions] = useState<SelectOption[]>([]);

  const [tipo, setTipo] = useState('');
  const [parceiro, setParceiro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telCelular, setTelCelular] = useState('');
  const [telComercial, setTelComercial] = useState('');
  const [nomeContato, setNomeContato] = useState('');

  const [fabricanteSel, setFabricanteSel] = useState('');
  const [modeloSel, setModeloSel] = useState('');
  const [versao, setVersao] = useState('');
  const [chassis_placa, setChassis_placa] = useState('');
  const [anoFabMod, setAnoFabMod] = useState('');

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState('');
  const [novoNomeProduto, setNovoNomeProduto] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState('');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoDesconto, setNovoDesconto] = useState('');
  const [novaDuracaoMin, setNovaDuracaoMin] = useState('');

  const [precoTotal, setPrecoTotal] = useState(0);
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  // Estados de validação
  const [erroAnoFabMod, setErroAnoFabMod] = useState('');
  const [erroChassiPlaca, setErroChassiPlaca] = useState('');

  // Estados do modal de agendamento
  const [isAgendamentoOpen, setIsAgendamentoOpen] = useState(false);
  const [dadosAgendamento, setDadosAgendamento] = useState<any>(null);

  // Função de validação para Ano Fab./Mod.
  const validarAnoFabMod = (valor: string): boolean => {
    if (!valor) {
      setErroAnoFabMod('');
      return true;
    }

    const numeros = valor.replace(/\D/g, '');
    if (numeros.length !== 8) {
      setErroAnoFabMod('Informe ano de fabricação e modelo (0000/0000)');
      return false;
    }

    const anoFab = parseInt(numeros.slice(0, 4), 10);
    const anoMod = parseInt(numeros.slice(4, 8), 10);
    const anoAtual = new Date().getFullYear();

    if (anoFab < 1900 || anoFab > anoAtual + 1) {
      setErroAnoFabMod(`Ano de fabricação deve estar entre 1900 e ${anoAtual + 1}`);
      return false;
    }

    if (anoMod < anoFab || anoMod > anoAtual + 1) {
      setErroAnoFabMod('Ano do modelo deve ser igual ou posterior ao ano de fabricação');
      return false;
    }

    setErroAnoFabMod('');
    return true;
  };

  // Função de validação para Chassi/Placa
  const validarChassiPlaca = (valor: string): boolean => {
    if (!valor) {
      setErroChassiPlaca('');
      return true;
    }

    const cleaned = valor.replace(/[^a-zA-Z0-9]/g, '');
    
    // Se tiver até 7 caracteres, valida como placa
    if (cleaned.length <= 7) {
      if (cleaned.length === 7) {
        // Placa válida: 3 letras + 4 números (ou padrão Mercosul: 3 letras + 1 número + 1 letra + 2 números)
        const placaAntiga = /^[A-Z]{3}[0-9]{4}$/i.test(cleaned);
        const placaMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/i.test(cleaned);
        
        if (placaAntiga || placaMercosul) {
          setErroChassiPlaca('');
          return true;
        } else {
          setErroChassiPlaca('Placa inválida. Use ABC1234 ou ABC1D23');
          return false;
        }
      } else if (cleaned.length > 0) {
        setErroChassiPlaca('Placa incompleta (7 caracteres)');
        return false;
      }
    } else {
      // Valida como chassi (17 caracteres)
      if (cleaned.length === 17) {
        setErroChassiPlaca('');
        return true;
      } else {
        setErroChassiPlaca('Chassi incompleto (17 caracteres)');
        return false;
      }
    }

    setErroChassiPlaca('');
    return true;
  };

  // Carregar dados do localStorage e mockFabricantes
  useEffect(() => {
    const tiposOsCadastrados = readArray<TipoOS>('tiposOs');
    setTiposOs(tiposOsCadastrados);
    setTipoOptions(tiposOsCadastrados.map(t => ({ value: t.id, label: t.nome })));

    const parceirosCadastrados = readArray<Parceiro>('parceiros');
    setParceiros(parceirosCadastrados);
    setParceiroOptions(parceirosCadastrados.map(p => ({ value: p.id, label: p.nome })));

    const equipesCadastradas = readArray<Equipe>('equipes');
    setEquipes(equipesCadastradas);

    // Usar mockFabricantes diretamente
    setFabricanteOptions(mockFabricantes);
  }, []);

  // Atualizar responsáveis quando parceiro muda
  const atualizarResponsaveis = (parceiroId: string) => {
    const equipasFiltradas = equipes.filter(e => e.parceiro === parceiroId);
    setResponsavelOptions(equipasFiltradas.map(e => ({
      value: e.id,
      label: e.login
    })));
    setResponsavel('');
  };

  const atualizarItensPorTipo = (tipoId: string) => {
    const tipoSelecionado = tiposOs.find(t => t.id === tipoId);
    const itens = tipoSelecionado?.itens ?? [];
    setItemOptions(itens.map((item) => ({
      value: item.id,
      label: `${item.nome} (${item.tipo === 'servico' ? 'Serviço' : 'Produto'})`
    })));
    setItemSelecionado('');
    setNovoNomeProduto('');
    setNovoPreco('');
    setNovoDesconto('');
    setNovaDuracaoMin('');
  };

  const selecionarItem = (itemId: string) => {
    setItemSelecionado(itemId);
    const tipoSelecionado = tiposOs.find(t => t.id === tipo);
    const item = tipoSelecionado?.itens?.find(i => i.id === itemId);
    if (item) {
      setNovoNomeProduto(item.nome);
      setNovoPreco(numberToCurrency(item.preco));
      setNovoDesconto(numberToCurrency(item.desconto ?? 0));
      setNovaDuracaoMin(String(item.duracao));
    } else {
      setNovoNomeProduto('');
      setNovoPreco('');
      setNovoDesconto('');
      setNovaDuracaoMin('');
    }
  };

  // Atualizar modelos quando fabricante muda
  const atualizarModelos = (fabricanteId: string) => {
    const fabricanteModelos = mockModelos[fabricanteId as keyof typeof mockModelos] || [];
    setModeloOptions(fabricanteModelos);
    setModeloSel('');
  };

  const handleAdicionarProduto = () => {
    if (!novoNomeProduto || !novaQuantidade || !novoPreco || !novaDuracaoMin) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const quantidade = Number(novaQuantidade);
    const preco = currencyToNumber(novoPreco);
    const desconto = currencyToNumber(novoDesconto) || 0;
    const duracaoMin = Number(novaDuracaoMin);
    const subtotal = (quantidade * preco) - desconto;

    const novoProduto: Produto = {
      id: `prod_${Date.now()}`,
      nome: novoNomeProduto,
      quantidade,
      precoUnitario: preco,
      desconto,
      subtotal,
      duracaoMin
    };

    setProdutos([...produtos, novoProduto]);
    setNovoNomeProduto('');
    setNovaQuantidade('');
    setNovoPreco('');
    setNovoDesconto('');
    setNovaDuracaoMin('');
  };

  const handleRemoverProduto = (idProduto: string) => {
    setProdutos(produtos.filter(p => p.id !== idProduto));
  };

  // Calcular totais
  useEffect(() => {
    const preco = produtos.reduce((sum, p) => sum + (p.quantidade * p.precoUnitario), 0);
    const desconto = produtos.reduce((sum, p) => sum + p.desconto, 0);
    setPrecoTotal(preco);
    setDescontoTotal(desconto);
  }, [produtos]);

  const total = precoTotal - descontoTotal;

  // Validar campos obrigatórios
  const validarCamposObrigatorios = (): boolean => {
    if (!tipo) {
      alert('Por favor, selecione o Tipo');
      return false;
    }
    if (!parceiro) {
      alert('Por favor, selecione o Parceiro');
      return false;
    }
    if (!responsavel) {
      alert('Por favor, selecione o Responsável');
      return false;
    }
    if (!nomeCliente) {
      alert('Por favor, preencha o Nome do Cliente');
      return false;
    }
    if (!cpfCnpj) {
      alert('Por favor, preencha o CPF/CNPJ');
      return false;
    }
    if (!emailCliente) {
      alert('Por favor, preencha o E-mail');
      return false;
    }
    if (!telCelular) {
      alert('Por favor, preencha o Tel. Celular');
      return false;
    }
    if (!fabricanteSel) {
      alert('Por favor, selecione o Fabricante');
      return false;
    }
    if (!modeloSel) {
      alert('Por favor, selecione o Modelo');
      return false;
    }
    if (!chassis_placa) {
      alert('Por favor, preencha o Chassi/Placa');
      return false;
    }
    if (!validarChassiPlaca(chassis_placa)) {
      alert('Por favor, corrija o Chassi/Placa');
      return false;
    }
    if (!anoFabMod) {
      alert('Por favor, preencha o Ano Fab./Mod.');
      return false;
    }
    if (!validarAnoFabMod(anoFabMod)) {
      alert('Por favor, corrija o Ano Fab./Mod.');
      return false;
    }
    return true;
  };

  // Salvar cliente na tabela
  const salvarCliente = () => {
    const agora = new Date().toISOString();
    
    // Encontrar o nome do tipo de OS
    const tipoSelecionado = tiposOs.find(t => t.id === tipo);
    
    const novoCliente: ClienteCompleto = {
      id: `cli_${Date.now()}`,
      responsavel: responsavel,
      parceiro: parceiro,
      nome: nomeCliente,
      nomeCliente: nomeCliente,
      email: emailCliente,
      emailCliente: emailCliente,
      cpfCnpj: cpfCnpj,
      telefone: telCelular,
      placaChassi: chassis_placa,
      placa: chassis_placa,
      chassi: chassis_placa,
      tipoAgendamento: tipo,
      tipo: tipoSelecionado?.nome || tipo,
      fabricante: fabricanteSel,
      modelo: modeloSel,
      cor: '',
      dataAgendamento: agora,
      horarioAgendamento: '',
      descricaoServico: observacoes,
      dataCriacao: agora,
      dataAtualizacao: agora,
    };

    saveCompleto(novoCliente);
    return novoCliente.id;
  };

  // Salvar orçamento
  const handleSalvarOrcamento = () => {
    if (!validarCamposObrigatorios()) {
      return;
    }

    try {
      salvarCliente();
      alert('Orçamento salvo com sucesso!');
      // Limpar formulário se desejar
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert('Erro ao salvar orçamento. Tente novamente.');
    }
  };

  // Gerar ordem de serviço - AGORA ABRE MODAL DE AGENDAMENTO
  const handleGerarOS = () => {
    if (!validarCamposObrigatorios()) {
      return;
    }

    try {
      // 1. Salvar cliente
      const clienteId = salvarCliente();
      
      // 2. Obter nomes e validar seleções
      const parceiroNome = parceiroOptions.find(p => p.value === parceiro)?.label || parceiro;
      const responsavelNome = responsavelOptions.find(r => r.value === responsavel)?.label || responsavel;
      const fabricanteNome = fabricanteOptions.find(f => f.value === fabricanteSel)?.label || fabricanteSel;
      const modeloNome = modeloOptions.find(m => m.value === modeloSel)?.label || modeloSel;
      const veiculoCompleto = `${fabricanteNome} ${modeloNome} ${versao || ''} ${anoFabMod}`.trim();
      
      // 3. Verificar se há produtos/serviços adicionados
      if (produtos.length === 0) {
        alert('Adicione pelo menos um serviço ou produto antes de gerar a OS.');
        return;
      }
      
      // 4. Calcular duração total
      const duracaoTotal = produtos.reduce((total, p) => total + (p.duracaoMin || 0), 0);
      
      if (duracaoTotal === 0) {
        alert('A duração estimada total deve ser maior que zero.');
        return;
      }
      
      // 5. Preparar dados do agendamento
      const tipoOSNome = tipoOptions.find(t => t.value === tipo)?.label || '';
      const itemNome = produtos.length > 0 ? produtos[0].nome : '';
      const itemId = produtos.length > 0 ? produtos[0].id : '';
      
      setDadosAgendamento({
        nomeCliente,
        telefone: telCelular,
        veiculo: veiculoCompleto,
        placa: chassis_placa,
        parceiro: parceiroNome,
        responsavel: responsavelNome,
        responsavelId: responsavel,
        tipoOsId: tipo,
        tipoOsNome: tipoOSNome,
        itemId: itemId,
        itemNome: itemNome,
        duracao: duracaoTotal,
        formaPagamento: '', // Você pode adicionar esses campos ao formulário se necessário
        meioPagamento: '',
      });
      
      // 6. Abrir modal de agendamento
      setIsAgendamentoOpen(true);
      
    } catch (error) {
      console.error('Erro ao preparar agendamento:', error);
      alert('Erro ao preparar agendamento. Tente novamente.');
    }
  };
  
  // Callback quando agendamento é confirmado
  const handleAgendamentoSuccess = (agendamentoId: string) => {
    try {
      // Obter dados para criar a OS
      const parceiroNome = parceiroOptions.find(p => p.value === parceiro)?.label || parceiro;
      const responsavelNome = responsavelOptions.find(r => r.value === responsavel)?.label || responsavel;
      const fabricanteNome = fabricanteOptions.find(f => f.value === fabricanteSel)?.label || fabricanteSel;
      const modeloNome = modeloOptions.find(m => m.value === modeloSel)?.label || modeloSel;
      const veiculoCompleto = `${fabricanteNome} ${modeloNome} ${versao || ''} ${anoFabMod}`.trim();
      
      // Criar card de status (OS) vinculado ao agendamento
      const novoCard = addStatusCardFromOrcamento({
        nomeCliente,
        veiculo: veiculoCompleto,
        parceiro: parceiroNome,
        responsavel: responsavelNome,
        chassis_placa,
        agendamentoId, // Vincular ao agendamento
      });
      
      alert(`✅ Ordem de Serviço ${novoCard.numero} criada e agendada com sucesso!\n\nCliente: ${nomeCliente}\nVeículo: ${veiculoCompleto}\n\nRedirecionando para Agendamento...`);
      
      // Redirecionar para a página de Agendamento
      router.push('/operacional/agendamento');
      
    } catch (error) {
      console.error('Erro ao gerar ordem de serviço:', error);
      alert('Erro ao gerar ordem de serviço. Tente novamente.');
    }
  };

  // Imprimir orçamento
  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Estilos para impressão */}
      <style jsx global>{`
        @media print {
          /* Ocultar elementos não necessários */
          aside,
          nav,
          button,
          .no-print {
            display: none !important;
          }
          
          /* Mostrar apenas conteúdo de impressão */
          .print-content {
            display: block !important;
          }
          
          /* Ocultar formulário na impressão */
          .hide-on-print {
            display: none !important;
          }
          
          /* Ajustar layout */
          body {
            background: white !important;
          }
          
          .print-only {
            display: block !important;
          }
          
          /* Melhorar quebras de página */
          .page-break-avoid {
            page-break-inside: avoid;
          }
          
          /* Ajustar cores de texto */
          * {
            color: #000 !important;
          }
          
          .print-label {
            color: #666 !important;
          }
        }
        
        @media screen {
          .print-content {
            display: none;
          }
        }
      `}</style>

      {/* Documento de Impressão - Visível apenas ao imprimir */}
      <div className="print-content">
        {/* Cabeçalho */}
        <div className="mb-8 pb-6 border-b-2 border-slate-900">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">ORÇAMENTO</h1>
              <p className="text-lg">Nº {Date.now().toString().slice(-6)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl mb-1">Sua Empresa</p>
              <p className="text-sm">Rua Exemplo, 123 - Centro</p>
              <p className="text-sm">São Paulo - SP - CEP 00000-000</p>
              <p className="text-sm">Telefone: (11) 9999-9999</p>
              <p className="text-sm">email@empresa.com.br</p>
              <p className="text-sm">CNPJ: 00.000.000/0000-00</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">
              Data de Emissão: {new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Informações do Cliente */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2 border-b border-slate-400">Informações do Cliente</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="print-label text-sm font-semibold">Nome</p>
              <p className="text-base">{nomeCliente || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">CPF/CNPJ</p>
              <p className="text-base">{cpfCnpj || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Email</p>
              <p className="text-base">{emailCliente || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Telefone Celular</p>
              <p className="text-base">{telCelular || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Telefone Comercial</p>
              <p className="text-base">{telComercial || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Contato</p>
              <p className="text-base">{nomeContato || '-'}</p>
            </div>
          </div>
        </div>

        {/* Informações do Veículo */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2 border-b border-slate-400">Informações do Veículo</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="print-label text-sm font-semibold">Fabricante</p>
              <p className="text-base">{fabricanteOptions.find(f => f.value === fabricanteSel)?.label || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Modelo</p>
              <p className="text-base">{modeloOptions.find(m => m.value === modeloSel)?.label || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Versão</p>
              <p className="text-base">{versao || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Chassi/Placa</p>
              <p className="text-base">{chassis_placa || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Ano Fab./Mod.</p>
              <p className="text-base">{anoFabMod || '-'}</p>
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 pb-2 border-b border-slate-400">Informações do Orçamento</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="print-label text-sm font-semibold">Tipo</p>
              <p className="text-base">{tipoOptions.find(t => t.value === tipo)?.label || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Parceiro</p>
              <p className="text-base">{parceiroOptions.find(p => p.value === parceiro)?.label || '-'}</p>
            </div>
            <div>
              <p className="print-label text-sm font-semibold">Responsável</p>
              <p className="text-base">{responsavelOptions.find(r => r.value === responsavel)?.label || '-'}</p>
            </div>
          </div>
        </div>

        {/* Produtos/Serviços */}
        {produtos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-slate-400">Produtos e Serviços</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 px-3 py-2 text-left">Item</th>
                  <th className="border border-slate-400 px-3 py-2 text-center">Qtd</th>
                  <th className="border border-slate-400 px-3 py-2 text-right">Preço Unit.</th>
                  <th className="border border-slate-400 px-3 py-2 text-center">Tempo</th>
                  <th className="border border-slate-400 px-3 py-2 text-right">Desconto</th>
                  <th className="border border-slate-400 px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto, index) => (
                  <tr key={produto.id} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                    <td className="border border-slate-400 px-3 py-2">{produto.nome}</td>
                    <td className="border border-slate-400 px-3 py-2 text-center">{produto.quantidade}</td>
                    <td className="border border-slate-400 px-3 py-2 text-right">R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border border-slate-400 px-3 py-2 text-center">
                      {`${Math.floor(produto.duracaoMin / 60).toString().padStart(2, '0')}:${(produto.duracaoMin % 60).toString().padStart(2, '0')}`}
                    </td>
                    <td className="border border-slate-400 px-3 py-2 text-right">R$ {produto.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="border border-slate-400 px-3 py-2 text-right font-bold">R$ {produto.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-slate-400 px-3 py-2 text-right">Subtotal:</td>
                  <td className="border border-slate-400 px-3 py-2 text-right">R$ {precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={5} className="border border-slate-400 px-3 py-2 text-right">Desconto Total:</td>
                  <td className="border border-slate-400 px-3 py-2 text-right">-R$ {descontoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={5} className="border border-slate-400 px-3 py-3 text-right text-lg">TOTAL:</td>
                  <td className="border border-slate-400 px-3 py-3 text-right text-lg font-bold">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Observações */}
        {observacoes && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 pb-2 border-b border-slate-400">Observações</h2>
            <p className="text-base whitespace-pre-wrap">{observacoes}</p>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-12 pt-6 border-t-2 border-slate-900">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="font-bold mb-3 pb-2 border-b border-slate-400">Assinatura do Cliente</p>
              <div className="mt-16 mb-2 border-b border-slate-400"></div>
              <p className="text-sm">Nome: ________________________________</p>
              <p className="text-sm">CPF/CNPJ: ____________________________</p>
            </div>
            <div>
              <p className="font-bold mb-3 pb-2 border-b border-slate-400">Assinatura do Responsável</p>
              <div className="mt-16 mb-2 border-b border-slate-400"></div>
              <p className="text-sm">Nome: ________________________________</p>
              <p className="text-sm">Data: _____/_____/__________</p>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t border-slate-300">
            <p className="text-sm font-semibold mb-1">Validade deste orçamento: 7 dias</p>
            <p className="text-xs">
              Este documento representa uma proposta comercial e não constitui compromisso até a confirmação do cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário - Oculto na impressão */}
      <div className="hide-on-print space-y-6">
      {/* Header */}
      <div className="page-break-avoid">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
          Novo Orçamento
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 no-print">
          Crie uma proposta comercial para seu cliente
        </p>
      </div>

      {/* Dados do Cliente */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 page-break-avoid">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Dados do Cliente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nome"
            placeholder="Nome do cliente"
            value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            required
          />
          <MaskedInput
            label="CPF/CNPJ"
            mask="cpfCnpj"
            value={cpfCnpj}
            onChange={(value) => setCpfCnpj(value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="Digite um e-mail válido"
            value={emailCliente}
            onChange={(e) => setEmailCliente(e.target.value)}
            required
          />
          <MaskedInput
            label="Tel. Celular"
            mask="phone"
            placeholder="(00) 00000-0000"
            value={telCelular}
            onChange={setTelCelular}
            required
          />
          <MaskedInput
            label="Tel. Comercial"
            mask="phone"
            placeholder="(00) 00000-0000"
            value={telComercial}
            onChange={setTelComercial}
          />
          <Input
            label="Contato"
            placeholder="Nome do Contato para Ligação"
            value={nomeContato}
            onChange={(e) => setNomeContato(e.target.value)}
          />
        </div>
      </div>

      {/* Dados do Veículo */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 page-break-avoid">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Dados do Veículo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Fabricante"
            value={fabricanteSel}
            onChange={(value) => {
              setFabricanteSel(value);
              atualizarModelos(value);
            }}
            options={fabricanteOptions}
            required
          />
          <Select
            label="Modelo"
            value={modeloSel}
            onChange={setModeloSel}
            options={modeloOptions}
            required
            disabled={!fabricanteSel}
            placeholder={fabricanteSel ? "Selecione um modelo" : "Selecione um fabricante para carregar os modelos"}
          />
          <Input
            label="Versão"
            placeholder="Versão do Modelo"
            value={versao}
            onChange={(e) => setVersao(e.target.value)}
          />
          <MaskedInput
            label="Chassi/Placa"
            mask="placaChassi"
            placeholder="Chassi (ex: 9BWZZZ377VT004251) ou Placa (ex: ABC-1234)"
            value={chassis_placa}
            onChange={(value) => {
              setChassis_placa(value);
              validarChassiPlaca(value);
            }}
            error={erroChassiPlaca}
            required
          />
          <MaskedInput
            label="Ano Fab./Mod."
            mask="anoFabMod"
            placeholder="0000/0000"
            value={anoFabMod}
            onChange={(value) => {
              setAnoFabMod(value);
              validarAnoFabMod(value);
            }}
            error={erroAnoFabMod}
            required
          />
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 page-break-avoid">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Informações Básicas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Tipo"
            value={tipo}
            onChange={(value) => {
              setTipo(value);
              atualizarItensPorTipo(value);
            }}
            options={tipoOptions}
            required
          />
          <Select
            label="Parceiro"
            value={parceiro}
            onChange={(value) => {
              setParceiro(value);
              atualizarResponsaveis(value);
            }}
            options={parceiroOptions}
            required
          />
          <Select
            label="Responsável"
            value={responsavel}
            onChange={setResponsavel}
            options={responsavelOptions}
            required
            disabled={!parceiro}
          />
        </div>
      </div>

      {/* Produtos/Serviços */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 page-break-avoid">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Produtos/Serviços
        </h2>

        {/* Formulário para adicionar itens */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 no-print">
          <Select
            label="Item"
            value={itemSelecionado}
            onChange={selecionarItem}
            options={itemOptions}
            disabled={!tipo || itemOptions.length === 0}
            placeholder={tipo ? "Selecione um item" : "Selecione um Tipo de OS"}
          />
          <Input
            label="Quantidade"
            type="number"
            placeholder="0"
            value={novaQuantidade}
            onChange={(e) => setNovaQuantidade(e.target.value)}
          />
          <MaskedInput
            label="Preço Unit."
            mask="currency"
            placeholder="R$ 0,00"
            value={novoPreco}
            onChange={setNovoPreco}
            disabled
          />
          <Input
            label="Tempo"
            type="text"
            placeholder="00:00"
            value={novaDuracaoMin ? `${Math.floor(Number(novaDuracaoMin) / 60).toString().padStart(2, '0')}:${(Number(novaDuracaoMin) % 60).toString().padStart(2, '0')}` : ''}
            disabled
          />
          <MaskedInput
            label="Desconto"
            mask="currency"
            placeholder="R$ 0,00"
            value={novoDesconto}
            onChange={setNovoDesconto}
            disabled
          />
          <div className="flex items-end">
            <Button onClick={handleAdicionarProduto} className="w-full">
              Adicionar
            </Button>
          </div>
        </div>

        {/* Tabela de produtos */}
        {produtos.length > 0 ? (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-900 dark:text-slate-100">Nome</th>
                  <th className="px-4 py-2 text-center text-slate-900 dark:text-slate-100">Qtd</th>
                  <th className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">Preço Unit.</th>
                  <th className="px-4 py-2 text-center text-slate-900 dark:text-slate-100">Tempo</th>
                  <th className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">Desconto</th>
                  <th className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">Subtotal</th>
                  <th className="px-4 py-2 text-center text-slate-900 dark:text-slate-100 no-print">Ação</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{produto.nome}</td>
                    <td className="px-4 py-2 text-center text-slate-900 dark:text-slate-100">{produto.quantidade}</td>
                    <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">
                      R$ {produto.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-center text-slate-900 dark:text-slate-100">
                      {`${Math.floor(produto.duracaoMin / 60).toString().padStart(2, '0')}:${(produto.duracaoMin % 60).toString().padStart(2, '0')}`}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100">
                      R$ {produto.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-900 dark:text-slate-100 font-semibold">
                      R$ {produto.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-center no-print">
                      <Button
                        onClick={() => handleRemoverProduto(produto.id)}
                        variant="danger"
                        size="sm"
                      >
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-700 dark:text-slate-400">
            Nenhum item adicionado.
          </div>
        )}

        {/* Resumo de preços */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-2">Preço</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              R$ {precoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-2">Desconto</p>
            <p className="text-xl font-semibold text-red-600 dark:text-red-400">
              -R$ {descontoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-400 mb-2">Total</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Informações Complementares */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 page-break-avoid">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Informações Complementares
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Observações do Orçamento
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Informações Complementares"
            rows={5}
            className="w-full rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm outline-none transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-md resize-y"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end no-print">
        <Button variant="outline" size="sm" className="min-w-[170px]">
          Cancelar
        </Button>
        <div className="relative">
          <Button 
            size="sm" 
            className="min-w-[170px]"
            onClick={() => setMostrarOpcoes(!mostrarOpcoes)}
          >
            Opções <span className={`inline-block ml-1 transition-transform duration-200 ${mostrarOpcoes ? 'rotate-180' : ''}`}>▼</span>
          </Button>
          
          {/* Dropdown de Opções */}
          {mostrarOpcoes && (
            <>
              {/* Overlay para fechar o dropdown ao clicar fora */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMostrarOpcoes(false)}
              />
              
              {/* Menu Dropdown */}
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
                <button
                  onClick={() => {
                    handleImprimir();
                    setMostrarOpcoes(false);
                  }}
                  className="w-full px-4 py-3 text-left text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                  <div className="font-medium">Imprimir Orçamento</div>
                  <div className="text-xs text-slate-700 dark:text-slate-400 mt-1">Imprimir ou salvar como PDF</div>
                </button>
                
                <button
                  onClick={() => {
                    handleSalvarOrcamento();
                    setMostrarOpcoes(false);
                  }}
                  className="w-full px-4 py-3 text-left text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
                >
                  <div className="font-medium">Salvar Orçamento</div>
                  <div className="text-xs text-slate-700 dark:text-slate-400 mt-1">Salvar sem gerar OS</div>
                </button>
                
                <button
                  onClick={() => {
                    handleGerarOS();
                    setMostrarOpcoes(false);
                  }}
                  className="w-full px-4 py-3 text-left text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="font-medium">Gerar Ordem de Serviço</div>
                  <div className="text-xs text-slate-700 dark:text-slate-400 mt-1">Criar OS a partir deste orçamento</div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
      {/* Fim do formulário */}

      {/* Modal de Agendamento */}
      {dadosAgendamento && (
        <AgendaOrcamentoModal
          isOpen={isAgendamentoOpen}
          onClose={() => setIsAgendamentoOpen(false)}
          onSuccess={handleAgendamentoSuccess}
          dadosOrcamento={dadosAgendamento}
        />
      )}
    </div>
  );
}

