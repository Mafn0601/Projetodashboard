import CrudTemplate from "@/components/templates/crud-template";

export default function Page() {
  return (
    <CrudTemplate
      title="Cadastro de Metas de Comissão"
      entityKey="metasComissao"
      fields={[
        { name: "equipe", label: "Equipe / Time" },
        { name: "metaMensal", label: "Meta Mensal (R$)", type: "number" }
      ]}
    />
  );
}

