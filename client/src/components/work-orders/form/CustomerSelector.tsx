import { useState, useEffect, useRef } from 'react';
import { Search, User, X, Check, Phone, Mail, MapPin, Loader2 } from 'lucide-react';
import { useCustomers, useCustomer } from '@/hooks/useCustomers';
import { maskDocument, maskPhone } from '@/lib/masks';
import type { Customer } from '@/types';

interface CustomerSelectorProps {
  value?: string;
  onChange: (customerId: string) => void;
  error?: string;
  initialCustomer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    document?: string;
    address?: string;
  } | null;
}

export function CustomerSelector({
  value,
  onChange,
  error,
  initialCustomer,
}: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch customers for search autocomplete
  const { data: searchResults, isLoading: isSearching } = useCustomers({
    search: debouncedSearch,
    limit: 8,
  });

  // Fetch full details of selected customer if ID is present
  const { data: selectedCustomerData, isLoading: isLoadingCustomer } = useCustomer(value);

  // The active customer to display in the card (either from query or initialCustomer)
  const currentCustomer = selectedCustomerData || (initialCustomer?.id === value ? initialCustomer : null);

  const handleSelect = (customer: Customer) => {
    onChange(customer.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-slate-700">
        Cliente <span className="text-red-500">*</span>
      </label>

      {value && (currentCustomer || isLoadingCustomer) ? (
        <div className="relative rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-white p-4 shadow-sm transition-all hover:border-indigo-200">
          {isLoadingCustomer && !currentCustomer ? (
            <div className="flex items-center space-x-3 py-2 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              <span>Carregando dados do cliente...</span>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-slate-800">{currentCustomer?.name}</h4>
                    {currentCustomer?.document && (
                      <span className="rounded-md bg-indigo-100/80 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {maskDocument(currentCustomer.document)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-2">
                    {currentCustomer?.phone && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{maskPhone(currentCustomer.phone)}</span>
                      </div>
                    )}
                    {currentCustomer?.email && (
                      <div className="flex items-center space-x-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{currentCustomer.email}</span>
                      </div>
                    )}
                    {currentCustomer?.address && (
                      <div className="flex items-center space-x-1.5 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{currentCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                title="Trocar cliente"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Trocar cliente
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Digite o nome, CPF/CNPJ, e-mail ou telefone do cliente..."
              className={`block w-full rounded-lg border py-2.5 pl-9 pr-10 text-sm shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20'
              }`}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>

          {/* Floating Dropdown Results */}
          {isOpen && (
            <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              {isSearching ? (
                <div className="flex items-center justify-center p-4 text-xs text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-600" />
                  Buscando clientes...
                </div>
              ) : searchResults && searchResults.data.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {searchResults.data.map((customer: Customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(customer)}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-indigo-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-indigo-700">
                            {customer.name}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-slate-500">
                            <span>{maskDocument(customer.document)}</span>
                            <span>•</span>
                            <span>{maskPhone(customer.phone)}</span>
                          </div>
                        </div>
                        <Check className="h-4 w-4 text-transparent transition group-hover:text-indigo-600" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  {searchTerm.trim().length > 0
                    ? 'Nenhum cliente encontrado para os termos digitados.'
                    : 'Comece a digitar para pesquisar clientes cadastrados.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
