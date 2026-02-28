'use client';

import { useEffect, useState } from "react";
import { appendItem, readArray } from "@/lib/storage";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select, SelectOption } from "../ui/Select";
import { MaskedInput, MaskType } from "../ui/MaskedInput";
import { cn } from "@/lib/utils";

export type CrudFieldType = "text" | "number" | "email" | "select" | "masked";

export interface CrudField {
  name: string;
  label: string;
  type?: CrudFieldType;
  options?: SelectOption[];
  mask?: MaskType;
  required?: boolean;
}

export interface CrudTemplateProps {
  title: string;
  entityKey: string;
  fields: CrudField[];
  useModal?: boolean;
  enableRowClick?: boolean;
  onRowClick?: (item: GenericEntity) => void;
}

type GenericEntity = {
  id: string;
  [key: string]: unknown;
};

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export default function CrudTemplate({
  title,
  entityKey,
  fields,
  useModal = false,
  enableRowClick = false,
  onRowClick
}: CrudTemplateProps) {
  const [items, setItems] = useState<GenericEntity[]>([]);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [fieldsWithOptions, setFieldsWithOptions] = useState<CrudField[]>(fields);

  useEffect(() => {
    const data = readArray<GenericEntity>(entityKey);
    setItems(data);
  }, [entityKey]);

  // Carregar parceiros dinamicamente se houver campo "parceiro"
  useEffect(() => {
    const updatedFields = fields.map((field) => {
      if (field.name === "parceiro" && field.type === "select") {
        const parceiros = readArray<GenericEntity>("parceiros");
        return {
          ...field,
          options: parceiros.map((p) => ({
            value: p.id as string,
            label: (p.nome as string) || p.id as string
          }))
        };
      }
      return field;
    });
    setFieldsWithOptions(updatedFields);
  }, [fields]);

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    fieldsWithOptions.forEach((field) => {
      if (field.required === false) return;
      const value = String(formState[field.name] ?? "").trim();
      if (!value) {
        nextErrors[field.name] = "Campo obrigatorio";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const entity: GenericEntity = {
      id: generateId(entityKey),
      ...formState
    };
    const next = appendItem<GenericEntity>(entityKey, entity);
    setItems(next);
    setFormState({});
    setErrors({});
    if (useModal) setIsModalOpen(false);
  };

  const handleEditStart = (item: GenericEntity) => {
    setEditingId(item.id as string);
    const initialState: Record<string, string> = {};
    fieldsWithOptions.forEach((field) => {
      initialState[field.name] = String(item[field.name] ?? "");
    });
    setEditFormState(initialState);
    setEditErrors({});
  };

  const handleEditChange = (field: string, value: string) => {
    setEditFormState((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    fieldsWithOptions.forEach((field) => {
      if (field.required === false) return;
      const value = String(editFormState[field.name] ?? "").trim();
      if (!value) {
        nextErrors[field.name] = "Campo obrigatorio";
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setEditErrors(nextErrors);
      return;
    }

    const updated = items.map((item) =>
      item.id === editingId ? { ...item, ...editFormState } : item
    );
    setItems(updated);
    localStorage.setItem(entityKey, JSON.stringify(updated));
    setEditingId(null);
    setEditFormState({});
    setEditErrors({});
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    localStorage.setItem(entityKey, JSON.stringify(updated));
    setEditingId(null);
  };

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return fieldsWithOptions.some((field) => {
      let value = String(item[field.name] ?? "").toLowerCase();
      
      // Se for select, buscar também pelo label
      if (field.type === "select" && field.options) {
        const option = field.options.find(opt => opt.value === item[field.name]);
        if (option) {
          const label = option.label.toLowerCase();
          if (label.includes(search)) return true;
        }
      }
      
      return value.includes(search);
    });
  });

  const renderForm = () => (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={handleSubmit}
      noValidate={false}
    >
      {fieldsWithOptions.map((field) => {
        const isRequired = field.required !== false;
        if (field.type === "select" && field.options) {
          return (
            <Select
              key={field.name}
              label={field.label}
              options={field.options}
              value={formState[field.name] ?? ""}
              onChange={(value) => handleChange(field.name, value)}
              placeholder={`Selecione ${field.label.toLowerCase()}`}
              error={errors[field.name]}
              required={isRequired}
            />
          );
        }
        if (field.type === "masked" && field.mask) {
          return (
            <MaskedInput
              key={field.name}
              label={field.label}
              mask={field.mask}
              value={formState[field.name] ?? ""}
              onChange={(value) => handleChange(field.name, value)}
              error={errors[field.name]}
              required={isRequired}
            />
          );
        }
        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type ?? "text"}
            value={formState[field.name] ?? ""}
            onChange={(e) => handleChange(field.name, e.target.value)}
            error={errors[field.name]}
            required={isRequired}
          />
        );
      })}
      <div className="md:col-span-3 flex justify-end gap-3">
        {useModal && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm">
          Salvar
        </Button>
      </div>
    </form>
  );

  const renderEditForm = () => (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={handleEditSubmit}
      noValidate={false}
    >
      {fieldsWithOptions.map((field) => {
        const isRequired = field.required !== false;
        if (field.type === "select" && field.options) {
          return (
            <Select
              key={field.name}
              label={field.label}
              options={field.options}
              value={editFormState[field.name] ?? ""}
              onChange={(value) => handleEditChange(field.name, value)}
              placeholder={`Selecione ${field.label.toLowerCase()}`}
              error={editErrors[field.name]}
              required={isRequired}
            />
          );
        }
        if (field.type === "masked" && field.mask) {
          return (
            <MaskedInput
              key={field.name}
              label={field.label}
              mask={field.mask}
              value={editFormState[field.name] ?? ""}
              onChange={(value) => handleEditChange(field.name, value)}
              error={editErrors[field.name]}
              required={isRequired}
            />
          );
        }
        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type ?? "text"}
            value={editFormState[field.name] ?? ""}
            onChange={(e) => handleEditChange(field.name, e.target.value)}
            error={editErrors[field.name]}
            required={isRequired}
          />
        );
      })}
      <div className="md:col-span-3 flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => {
            if (editingId) {
              handleDelete(editingId);
            }
          }}
        >
          Deletar
        </Button>
        <Button type="submit" size="sm">
          Salvar
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
          <p className="text-xs text-slate-700 dark:text-slate-400">
            Cadastro básico com listagem rápida utilizando localStorage.
          </p>
        </div>
        {useModal && (
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            + Novo Cadastro
          </Button>
        )}
      </header>

      {!useModal && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Novo registro
          </h2>
          {renderForm()}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-50">
          Registros cadastrados
        </h2>
        {items.length === 0 ? (
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Nenhum registro cadastrado até o momento.
          </p>
        ) : (
          <>
            <div className="mb-4 flex justify-end w-full">
              <div className="w-1/4">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            {filteredItems.length === 0 ? (
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Nenhum resultado encontrado para "{searchTerm}".
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="scrollbar-thin max-h-80 overflow-auto overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[600px]">
                    <thead className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 sticky top-0">
                      <tr>
                        {fieldsWithOptions.map((field) => (
                          <th
                            key={field.name}
                            className="px-3 py-2 font-medium"
                          >
                            {field.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id as string}
                          onClick={() => enableRowClick && onRowClick?.(item)}
                          className={cn(
                            "border-t border-slate-200 dark:border-slate-800 odd:bg-slate-50 even:bg-slate-100 dark:odd:bg-slate-950/60 dark:even:bg-slate-900/40",
                            enableRowClick && "cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          )}
                        >
                          {fieldsWithOptions.map((field) => {
                            let value = String(item[field.name] ?? "").trim() || "-";
                            
                            // Renderização especial para campos select (mostrar label em vez de value)
                            if (field.type === "select" && value !== "-" && field.options) {
                              const option = field.options.find(opt => opt.value === value);
                              if (option) {
                                value = option.label;
                              }
                            }
                            
                            // Renderização especial para campo status
                            if (field.name === "status" && value !== "-") {
                              const isAtivo = value.toLowerCase() === "ativo";
                              return (
                                <td
                                  key={field.name}
                                  className="px-3 py-1.5"
                                >
                                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                    isAtivo
                                      ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                                      : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800"
                                  }`}>
                                    {value}
                                  </span>
                                </td>
                              );
                            }
                            
                            return (
                              <td
                                key={field.name}
                                className="px-3 py-1.5 text-slate-900 dark:text-slate-100"
                              >
                                {value}
                              </td>
                            );
                          })}
                          <td className="px-3 py-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(item);
                              }}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {useModal && isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Novo Cadastro
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-2xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-modal p-6">
              {renderForm()}
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setEditingId(null)}
        >
          <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Editar Cadastro
              </h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-slate-700 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-2xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-modal p-6">
              {renderEditForm()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

