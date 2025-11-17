import { useState } from "react";
import { Label, Button, Text } from "@medusajs/ui";
import { XMark, User } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { CustomerSelectorModal } from "./customer-selector-modal";

type CustomerSelectorProps = {
  onSelectCustomer: (customer: HttpTypes.AdminCustomer) => void;
  selectedCustomer: HttpTypes.AdminCustomer | null;
  onClear: () => void;
};

export function CustomerSelector({ onSelectCustomer, selectedCustomer, onClear }: CustomerSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSelectCustomer = (customer: HttpTypes.AdminCustomer) => {
    onSelectCustomer(customer);
    setShowModal(false);
  };

  return (
    <div>
      <Label className="mb-2">
        Wybierz klienta
      </Label>

      {selectedCustomer ? (
        // Show selected customer
        <div className="flex items-center justify-between p-3 border border-ui-border-base rounded-md bg-ui-bg-subtle">
          <div className="flex items-center gap-3">
            <User className="text-ui-fg-muted" />
            <div className="flex flex-col">
              <Text className="font-medium">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </Text>
              <Text className="text-sm text-ui-fg-subtle">{selectedCustomer.email}</Text>
            </div>
          </div>
          <Button
            variant="transparent"
            size="small"
            onClick={onClear}
            className="text-ui-fg-muted hover:text-ui-fg-base"
          >
            <XMark />
          </Button>
        </div>
      ) : (
        // Show button to open modal
        <Button
          variant="secondary"
          onClick={() => setShowModal(true)}
          className="w-full justify-start"
        >
          <User />
          <span>Wybierz klienta z listy</span>
        </Button>
      )}

      {/* Customer Selection Modal */}
      {showModal && (
        <CustomerSelectorModal
          onSelectCustomer={handleSelectCustomer}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
