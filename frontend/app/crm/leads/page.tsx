import CrudTemplate from "@/components/templates/crud-template";

export default function Page() {
  return (
    <CrudTemplate
      title="Leads"
      entityKey="leads"
      fields={[
        { name: "nome", label: "Nome do Lead" },
        { name: "origem", label: "Origem" },
        { name: "telefone", label: "Telefone" }
      ]}
    />
  );
}

