"use client";
import React, { useState, useEffect, FormEvent } from 'react';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialCliente?: any;
  initialVeiculo?: any;
};

const FABRICANTES = ['Fiat', 'VW', 'GM', 'Ford', 'Toyota', 'Honda', 'Hyundai'];
const MODELOS_POR_FABRICANTE: Record<string, string[]> = {
  Fiat: ['Mobi', 'Argo', 'Cronos', 'Pulse', 'Fastback', 'Toro', 'Strada'],
  VW: ['Polo', 'Virtus', 'Nivus', 'T-Cross', 'Taos', 'Amarok'],
  GM: ['Onix', 'Onix Plus', 'Tracker', 'Equinox', 'S10'],
  Ford: ['Ranger', 'Maverick', 'Mustang', 'Territory'],
  Toyota: ['Yaris', 'Corolla', 'Corolla Cross', 'Hilux', 'SW4'],
  Honda: ['City', 'HR-V', 'ZR-V', 'Civic'],
  Hyundai: ['HB20', 'HB20S', 'Creta'],
};

export default function ClienteVeiculoModal({ open, setOpen, initialCliente, initialVeiculo }: Props) {
  const [activeTab, setActiveTab] = useState<'cliente' | 'veiculo'>('cliente');
  
  // --- Estados do Cliente ---
  const [tipoPessoa, setTipoPessoa] = useState('PF');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [comercial, setComercial] = useState('');
  
  // Endereço
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // --- Estados do Veículo ---
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [versao, setVersao] = useState('');
  const [renavam, setRenavam] = useState('');
  const [chassi, setChassi] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [anoFab, setAnoFab] = useState('');
  const [anoMod, setAnoMod] = useState('');
  const [km, setKm] = useState('');
  const [parceiro, setParceiro] = useState('');
  const [unidade, setUnidade] = useState('');
  const [vendedor1, setVendedor1] = useState('');
  const [vendedor2, setVendedor2] = useState('');
  const [gerente1, setGerente1] = useState('');
  const [gerente2, setGerente2] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('Novo');
  const [modalidade, setModalidade] = useState('Venda Direta');
  const [responsavel, setResponsavel] = useState('');
  const [statusErp, setStatusErp] = useState('Integrado');

  const [modelosDisponiveis, setModelosDisponiveis] = useState<string[]>([]);

  // Carregar dados ao abrir (Edição)
  useEffect(() => {
    if (open && initialCliente) {
      setNome(initialCliente.nome || '');
      setCpfCnpj(initialCliente.cpfCnpj || '');
      setEmail(initialCliente.email || '');
      setCelular(initialCliente.telefone || '');
      setCidade(initialCliente.cidade || '');
      setUf(initialCliente.uf || '');
      // Outros campos viriam do objeto completo do cliente
    } else if (open && !initialCliente) {
      // Limpar formulário para novo cadastro
      limparFormulario();
    }
  }, [open, initialCliente]);

  // Atualizar modelos quando fabricante muda
  useEffect(() => {
    if (fabricante) {
      setModelosDisponiveis(MODELOS_POR_FABRICANTE[fabricante] || []);
    } else {
      setModelosDisponiveis([]);
    }
  }, [fabricante]);

  function limparFormulario() {
    setTipoPessoa('PF'); setCpfCnpj(''); setNome(''); setEmail(''); setCelular(''); setComercial('');
    setCep(''); setRua(''); setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setUf('');
    setFabricante(''); setModelo(''); setVersao(''); setRenavam(''); setChassi(''); setPlaca('');
    setCor(''); setAnoFab(''); setAnoMod(''); setKm(''); setParceiro(''); setUnidade('');
    setVendedor1(''); setVendedor2(''); setGerente1(''); setGerente2('');
    setTipoVeiculo('Novo'); setModalidade('Venda Direta'); setResponsavel(''); setStatusErp('Integrado');
    setActiveTab('cliente');
  }

  // --- Máscaras e Utilitários ---
  const handleCpfCnpj = (v: string) => {
    v = v.replace(/\D/g, '');
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      v = v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCpfCnpj(v);
  };

  const handlePlaca = (v: string) => {
    // Mercosul AAA-0A00 ou Antiga AAA-0000
    let upper = v.toUpperCase();
    if (upper.length > 8) return;
    setPlaca(upper);
  };

  const buscarCep = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        setUf(data.uf);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Salvando...", { nome, cpfCnpj, placa, modelo });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            <i className={`fa ${initialCliente ? 'fa-edit' : 'fa-plus'} mr-2`}></i>
            {initialCliente ? 'Editar Cliente' : 'Novo Cliente'}
          </h3>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <i className="fa fa-times text-xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-white">
          <button
            onClick={() => setActiveTab('cliente')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cliente' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fa fa-user mr-2"></i> Dados do Cliente
          </button>
          <button
            onClick={() => setActiveTab('veiculo')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'veiculo' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <i className="fa fa-car mr-2"></i> Veículo (Concessionária)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form id="clienteForm" onSubmit={handleSubmit}>
            
            {/* ABA CLIENTE */}
            <div className={activeTab === 'cliente' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo *</label>
                  <div className="flex gap-4 mt-2">
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio text-blue-600" name="tipoPessoa" value="PF" checked={tipoPessoa === 'PF'} onChange={(e) => setTipoPessoa(e.target.value)} />
                      <span className="ml-2 text-sm">Física</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" className="form-radio text-blue-600" name="tipoPessoa" value="PJ" checked={tipoPessoa === 'PJ'} onChange={(e) => setTipoPessoa(e.target.value)} />
                      <span className="ml-2 text-sm">Jurídica</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">CPF/CNPJ *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fa fa-id-card"></i></span>
                    <input id="cpf-cnpj" name="cpfCnpj" type="text" required value={cpfCnpj} onChange={(e) => handleCpfCnpj(e.target.value)} className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="000.000.000-00" />
                  </div>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nome / Razão Social *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fa fa-user"></i></span>
                    <input id="nome" name="nome" type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-gray-700 mb-1">E-mail *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fa fa-envelope"></i></span>
                    <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Celular *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fa fa-mobile"></i></span>
                    <input id="celular" name="celular" type="text" required value={celular} onChange={(e) => setCelular(e.target.value)} className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tel. Comercial</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><i className="fa fa-phone"></i></span>
                    <input id="comercial" name="comercial" type="text" value={comercial} onChange={(e) => setComercial(e.target.value)} className="w-full pl-10 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div className="md:col-span-12 border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Endereço</h4>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">CEP *</label>
                  <div className="flex">
                    <input id="cep" name="cep" type="text" required value={cep} onChange={(e) => setCep(e.target.value)} onBlur={buscarCep} className="w-full border border-gray-300 rounded-l px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="00000-000" />
                    <button type="button" onClick={buscarCep} className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 hover:bg-gray-300">
                      <i className="fa fa-search text-gray-600"></i>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rua *</label>
                  <input id="rua" name="rua" type="text" required value={rua} onChange={(e) => setRua(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Número *</label>
                  <input id="numero" name="numero" type="text" required value={numero} onChange={(e) => setNumero(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Complemento</label>
                  <input id="complemento" name="complemento" type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bairro *</label>
                  <input id="bairro" name="bairro" type="text" required value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cidade *</label>
                  <input id="cidade" name="cidade" type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">UF *</label>
                  <input id="uf" name="uf" type="text" required value={uf} onChange={(e) => setUf(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>

            {/* ABA VEÍCULO */}
            <div className={activeTab === 'veiculo' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Fabricante *</label>
                  <select required value={fabricante} onChange={(e) => setFabricante(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option value="">Selecione</option>
                    {FABRICANTES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Modelo *</label>
                  <select required value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" disabled={!fabricante}>
                    <option value="">Selecione</option>
                    {modelosDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Versão</label>
                  <input id="versao" name="versao" type="text" value={versao} onChange={(e) => setVersao(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Placa *</label>
                  <input id="placa" name="placa" type="text" required value={placa} onChange={(e) => handlePlaca(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 uppercase" placeholder="AAA-0A00" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chassi *</label>
                  <input id="chassi" name="chassi" type="text" required value={chassi} onChange={(e) => setChassi(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Renavam</label>
                  <input id="renavam" name="renavam" type="text" value={renavam} onChange={(e) => setRenavam(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cor *</label>
                  <input id="cor" name="cor" type="text" required value={cor} onChange={(e) => setCor(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ano Fab. *</label>
                  <input id="anoFab" name="anoFab" type="number" required value={anoFab} onChange={(e) => setAnoFab(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ano Mod. *</label>
                  <input id="anoMod" name="anoMod" type="number" required value={anoMod} onChange={(e) => setAnoMod(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">KM</label>
                  <input id="km" name="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo *</label>
                  <select required value={tipoVeiculo} onChange={(e) => setTipoVeiculo(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option>Novo</option>
                    <option>Seminovo</option>
                    <option>Usado</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Modalidade *</label>
                  <select required value={modalidade} onChange={(e) => setModalidade(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                    <option>Venda Direta</option>
                    <option>Varejo</option>
                    <option>Frota</option>
                  </select>
                </div>

                <div className="md:col-span-12 border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Dados Comerciais</h4>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Parceiro *</label>
                  <input id="parceiro" name="parceiro" type="text" required value={parceiro} onChange={(e) => setParceiro(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unidade *</label>
                  <input id="unidade" name="unidade" type="text" required value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Responsável *</label>
                  <input id="responsavel" name="responsavel" type="text" required value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendedor 1</label>
                  <input id="vendedor1" name="vendedor1" type="text" value={vendedor1} onChange={(e) => setVendedor1(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendedor 2</label>
                  <input type="text" value={vendedor2} onChange={(e) => setVendedor2(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gerente 1</label>
                  <input type="text" value={gerente1} onChange={(e) => setGerente1(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Status ERP</label>
                  <input type="text" value={statusErp} readOnly className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 text-gray-500" />
                </div>

              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="clienteForm"
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
          >
            <i className="fa fa-check mr-2"></i> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}