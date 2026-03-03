# CEP Field Implementation Guide

## Overview
This implementation adds automatic address lookup via ViaCEP when entering a postal code in the parceiro (partner) form.

## Components Modified

### 1. MaskedInput.tsx
- **Added**: CEP mask type (`'cep'`) to `MaskType`
- **Added**: `applyCepMask()` function that formats input as `XXXXX-XXX` (5 digits, hyphen, 3 digits)
- **Updated**: `handleChange()` method to apply CEP mask when `mask="cep"`
- **Updated**: `useEffect()` to apply CEP mask to external values

### 2. crud-template.tsx
- **Updated**: CEP field rendering to use `MaskedInput` with `mask="cep"` instead of plain `Input`
- **Updated**: CEP field handlers to call `handleCepChange()` which triggers automatic ViaCEP lookup
- **Preserved**: Existing `buscarCep()` function that queries ViaCEP API
  - Cleans CEP (removes non-numeric characters)
  - Validates length === 8 digits
  - Calls `https://viacep.com.br/ws/{cep}/json/`
  - Auto-fills `rua`, `bairro`, `cidade`, `estado` fields based on ViaCEP response
  - Shows "Buscando..." indicator while fetching
  - Handles both create and edit (isEditMode parameter)

### 3. parceiro/page.tsx
- **Updated**: CEP field definition from `{ name: "cep", label: "CEP" }` to `{ name: "cep", label: "CEP", type: "masked", mask: "cep" }`

## User Experience Flow

### Creation Form
1. User enters CEP in the "CEP" field
   - Input is automatically formatted as user types: `01310100` → `01310-100`
2. When user completes 8 digits:
   - "Buscando..." indicator appears
   - ViaCEP API is queried
   - Response populates:
     - `rua` (street name from ViaCEP's `logradouro`)
     - `bairro` (neighborhood)
     - `cidade` (city from `localidade`)
     - `estado` (state from `uf`)
3. User can edit auto-filled fields or leave as-is
4. Form submission proceeds normally

### Edit Form
- Same behavior when editing existing partner
- CEP field uses `handleCepChange(..., true)` to update edit form state

## ViaCEP Response Mapping

```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

Maps to:
```javascript
{
  cep: "01310-100",
  endereco: "Avenida Paulista",    // from logradouro
  bairro: "Bela Vista",
  cidade: "São Paulo",             // from localidade
  estado: "SP"                      // from uf
}
```

## Testing

### Manual Testing
1. Open the Parceiro (Partner) creation form
2. Enter a valid Brazilian CEP (e.g., `01310-100` for São Paulo)
3. Verify:
   - CEP is formatted as `XXXXX-XXX` while typing
   - After 8 digits, "Buscando..." appears briefly
   - Fields auto-populate with street, neighborhood, city, state
   - Created partner displays in the list

### Valid Test CEPs
- **01310-100** - Avenida Paulista, São Paulo, SP
- **88015-100** - Florianópolis, SC
- **30150-350** - Belo Horizonte, MG
- **70040-902** - Brasília, DF
- **50010-020** - Recife, PE

### Error Scenarios
- **Invalid CEP**: Less than 8 digits → no API call
- **Not found CEP**: ViaCEP returns `{ "erro": true }` → no data populated, no error message
- **Network error**: Caught in try/catch, logged to console, "Buscando..." clears

## Code Architecture

```
MaskedInput (UI Component)
  └─> applyCepMask() - formats display value
       └─> onChange callback pushed to parent

crud-template (Template Component)
  └─> handleCepChange() - special CEP change handler
       └─> handleChange() - updates form state
       └─> buscarCep() - queries ViaCEP when 8 digits entered
            ├─> fetch https://viacep.com.br/ws/{cep}/json/
            ├─> Parse JSON response
            └─> Update rua/bairro/cidade/estado fields

parceiro/page.tsx (Implementation)
  └─> CrudTemplate with fields=[..., { name: "cep", type: "masked", mask: "cep" }]
```

## Future Enhancements
- Add validation for invalid CEPs (ViaCEP returns erro: true)
- Add toast notification when city/state auto-filled
- Support for international postal codes (optional future)
- Reusable CEP lookup hook for other forms
