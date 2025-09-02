import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Text, Container, Heading } from '@medusajs/ui';
import { PencilSquare, Spinner } from "@medusajs/icons";
import { useNavigate } from 'react-router-dom';

import { SectionRow } from '../../../../../components/common/section/section-row';

type ProductGPSRSectionProps = {
  product: any;
};

export const ProductGPSRSection = ({ product }: ProductGPSRSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Extract GPSR data directly from product metadata instead of using the API
  const gpsrData = useMemo(() => {
    if (!product || !product.metadata) return null;
    
    return {
      producerName: product.metadata.gpsr_producer_name || '',
      producerAddress: product.metadata.gpsr_producer_address || '',
      producerContact: product.metadata.gpsr_producer_contact || '',
      importerName: product.metadata.gpsr_importer_name || '',
      importerAddress: product.metadata.gpsr_importer_address || '',
      importerContact: product.metadata.gpsr_importer_contact || '',
      instructions: product.metadata.gpsr_instructions || '',
      certificates: product.metadata.gpsr_certificates || '',
    };
  }, [product]);
  
  // Determine if GPSR data exists for this product
  const hasGPSRData = useMemo(() => {
    return gpsrData && (
      gpsrData.producerName || 
      gpsrData.producerAddress || 
      gpsrData.producerContact || 
      gpsrData.importerName || 
      gpsrData.importerAddress || 
      gpsrData.importerContact || 
      gpsrData.instructions || 
      gpsrData.certificates
    );
  }, [gpsrData]);

  const handleEditClick = () => {
    navigate(`/products/${product.id}/edit-gpsr`);
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="animate-spin text-ui-fg-subtle" />
      </div>
    );
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t('products.gpsr.title')}</Heading>
        <Button
          size="small"
          variant="secondary"
          onClick={handleEditClick}
        >
          <PencilSquare className="text-ui-fg-subtle" />
          <span className="ml-1">{t('actions.edit')}</span>
        </Button>
      </div>

      {hasGPSRData ? (
        <div className="divide-y">
          {/* Producer Information */}
          {(gpsrData.producerName || gpsrData.producerAddress || gpsrData.producerContact) && (
            <div className="px-6 py-4">
              <Heading level="h3" className="mb-2">{t('products.gpsr.sections.producer')}</Heading>
              {gpsrData.producerName && (
                <SectionRow 
                  title={t('products.gpsr.fields.producerName')} 
                  value={gpsrData.producerName} 
                />
              )}
              {gpsrData.producerAddress && (
                <SectionRow 
                  title={t('products.gpsr.fields.producerAddress')} 
                  value={gpsrData.producerAddress} 
                />
              )}
              {gpsrData.producerContact && (
                <SectionRow 
                  title={t('products.gpsr.fields.producerContact')} 
                  value={gpsrData.producerContact} 
                />
              )}
            </div>
          )}
          
          {/* Importer Information */}
          {(gpsrData.importerName || gpsrData.importerAddress || gpsrData.importerContact) && (
            <div className="px-6 py-4">
              <Heading level="h3" className="mb-2">{t('products.gpsr.sections.importer')}</Heading>
              {gpsrData.importerName && (
                <SectionRow 
                  title={t('products.gpsr.fields.importerName')} 
                  value={gpsrData.importerName} 
                />
              )}
              {gpsrData.importerAddress && (
                <SectionRow 
                  title={t('products.gpsr.fields.importerAddress')} 
                  value={gpsrData.importerAddress} 
                />
              )}
              {gpsrData.importerContact && (
                <SectionRow 
                  title={t('products.gpsr.fields.importerContact')} 
                  value={gpsrData.importerContact} 
                />
              )}
            </div>
          )}
          
          {/* Instructions/Warnings */}
          {gpsrData.instructions && (
            <div className="px-6 py-4">
              <SectionRow 
                title={t('products.gpsr.fields.instructions')} 
                value={gpsrData.instructions} 
              />
            </div>
          )}
          
          {/* Certificates */}
          {gpsrData.certificates && (
            <div className="px-6 py-4">
              <SectionRow 
                title={t('products.gpsr.fields.certificates')} 
                value={gpsrData.certificates} 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">
            {t('general.noRecordsFound')}
          </Text>
        </div>
      )}
    </Container>
  );
};
