import CrudTemplate from "@/components/templates/crud-template";

export default function Page() {
  return (
    <CrudTemplate
      title="Cadastro de Usuários"
      entityKey="usuarios"
      fields={[
        { name: "nome", label: "Nome do Usuário" },
        { name: "email", label: "E-mail", type: "email" },
        { name: "perfil", label: "Perfil / Função" }
      ]}
    />
  );
}

