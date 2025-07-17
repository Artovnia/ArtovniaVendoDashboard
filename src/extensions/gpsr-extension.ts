import { z } from "zod";

/**
 * GPSR Form Extension
 * 
 * This module adds GPSR (General Product Safety Regulation) fields to the product creation form.
 * - complianceCert: Optional compliance certificate information
 * - safetyWarning: Required safety warning information
 * - origin: Required country of origin information
 */
export const gpsrFormExtension = {
  customFields: {
    product: {
      forms: [
        {
          zone: "product.create.general",
          fields: {
            gpsr_compliance_cert: {
              label: "Compliance Certificate",
              description: "Product compliance certificate information (optional)",
              placeholder: "Enter compliance certificate details",
              validation: z.string().optional(),
            },
            gpsr_safety_warning: {
              label: "Safety Warning",
              description: "Required safety warning information",
              placeholder: "Enter safety warnings",
              validation: z.string().min(1, "Safety warning is required"),
            },
            gpsr_origin: {
              label: "Country of Origin",
              description: "Required country of origin information",
              placeholder: "Enter country of origin",
              validation: z.string().min(1, "Country of origin is required"),
            },
          },
        },
      ],
      configs: [],
    },
  },
};
