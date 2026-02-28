export type Vehicle = {
  id: string;
  fabricante: string;
  modelo: string;
  versao?: string;
  placa?: string;
  chassi: string;
  anoFabricacao: number;
  anoModelo: number;
  km?: number;
  status: string;
};

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: '1',
    fabricante: 'Fiat',
    modelo: 'Mobi',
    versao: 'Like 1.0',
    placa: 'ABC-1234',
    chassi: '9BW12345678901234',
    anoFabricacao: 2023,
    anoModelo: 2023,
    km: 15000,
    status: 'Disponível',
  },
  {
    id: '2',
    fabricante: 'VW',
    modelo: 'Polo',
    versao: 'Track',
    placa: 'XYZ-9876',
    chassi: '9BW12345678901235',
    anoFabricacao: 2024,
    anoModelo: 2024,
    km: 5000,
    status: 'Reservado',
  },
  {
    id: '3',
    fabricante: 'Toyota',
    modelo: 'Corolla',
    versao: 'XEi',
    placa: 'BRA-2E19',
    chassi: '9BW12345678901236',
    anoFabricacao: 2022,
    anoModelo: 2023,
    km: 35000,
    status: 'Vendido',
  }
];

export async function getVehicles(searchParams: Record<string, string | string[] | undefined>): Promise<Vehicle[]> {
  // Simula delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filtered = [...MOCK_VEHICLES];

  const fabricante = searchParams?.fabricante as string;
  if (fabricante && fabricante !== 'Todos') {
    filtered = filtered.filter((v) => v.fabricante === fabricante);
  }

  const modelo = searchParams?.modelo as string;
  if (modelo) {
    filtered = filtered.filter((v) => v.modelo.toLowerCase().includes(modelo.toLowerCase()));
  }

  const placa = searchParams?.placa as string;
  if (placa) {
    filtered = filtered.filter((v) => v.placa?.toLowerCase().includes(placa.toLowerCase()));
  }

  const status = searchParams?.status as string;
  if (status && status !== 'Todos') {
    filtered = filtered.filter((v) => v.status === status);
  }

  return filtered;
}