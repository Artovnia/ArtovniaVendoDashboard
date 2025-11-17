import { useState } from "react";
import { Button, Input, Text, Heading, Badge } from "@medusajs/ui";
import { MagnifyingGlass, XMark } from "@medusajs/icons";
import { useCustomers } from "../../../hooks/api/customers";
import { HttpTypes } from "@medusajs/types";

type CustomerSelectorModalProps = {
  onSelectCustomer: (customer: HttpTypes.AdminCustomer) => void;
  onClose: () => void;
};

export function CustomerSelectorModal({ onSelectCustomer, onClose }: CustomerSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch customers with search and pagination
  const { customers, isLoading, count } = useCustomers({
    q: searchQuery || undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const totalPages = Math.ceil((count || 0) / limit);

  const handleSelectCustomer = (customer: HttpTypes.AdminCustomer) => {
    onSelectCustomer(customer);
    onClose();
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on new search
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-ui-bg-base rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ui-border-base">
          <Heading level="h2">Wybierz klienta</Heading>
          <Button variant="transparent" onClick={onClose}>
            <XMark />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-ui-border-base">
          <div className="relative">
            <Input
              type="text"
              placeholder="Szukaj po emailu, imieniu lub nazwisku..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-fg-muted">
              <MagnifyingGlass />
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Text className="text-ui-fg-subtle">Ładowanie...</Text>
            </div>
          ) : !customers || customers.length === 0 ? (
            <div className="text-center py-8">
              <Text className="text-ui-fg-subtle">
                {searchQuery ? "Nie znaleziono klientów" : "Brak klientów"}
              </Text>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full p-4 text-left border border-ui-border-base rounded-lg hover:bg-ui-bg-subtle hover:border-ui-border-strong transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Text className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </Text>
                        {customer.has_account && (
                          <Badge size="small" color="green">
                            Konto
                          </Badge>
                        )}
                      </div>
                      <Text size="small" className="text-ui-fg-subtle">
                        {customer.email}
                      </Text>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-ui-border-base flex items-center justify-between">
            <Text size="small" className="text-ui-fg-subtle">
              Strona {page} z {totalPages} ({count} klientów)
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Poprzednia
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Następna
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
