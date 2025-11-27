import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import ModalSimple from '@/components/ui/ModalSimple';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import type { Demand } from '../types';
import EmailHistory from './EmailHistory';

const Gestionnaire = ({ demand }: { demand: Demand & { email_count?: number } }) => {
  const gestionnaires = demand.Gestionnaires || [];
  const affectationGestionnaire = demand['Affecté à'];
  const [emails, setEmails] = useState<RouterOutput['demands']['user']['listEmails'] | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { refetch: refetchEmails } = trpc.demands.user.listEmails.useQuery(
    { demand_id: demand.id },
    {
      enabled: false,
    }
  );

  // Combine both sources and remove duplicates
  const allGestionnaires = [...new Set([...gestionnaires, ...(affectationGestionnaire ? [affectationGestionnaire].flat() : [])])].filter(
    Boolean
  );

  const handleEmailClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!emails && !isLoadingEmails) {
      setIsLoadingEmails(true);
      const result = await refetchEmails();
      if (result.data) {
        setEmails(result.data);
      }
      setIsLoadingEmails(false);
    }
    setIsModalOpen(true);
  };

  // Use email_count from the server if available, otherwise use emails length
  const emailCount = demand.email_count ?? emails?.length ?? 0;

  return (
    <div className="w-full leading-5">
      {allGestionnaires.length === 0 ? (
        <div className="text-gray-400 text-sm">Non affecté</div>
      ) : (
        allGestionnaires.map((gestionnaire, index) => (
          <div key={index} className="font-medium">
            {gestionnaire}
          </div>
        ))
      )}

      {/* Email history */}
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div onClick={handleEmailClick} className="cursor-pointer flex items-center gap-2 hover:bg-gray-50 -mx-2 px-2 py-1 rounded">
          {isLoadingEmails ? (
            <div className="flex items-center gap-1 text-gray-500">
              <Loader size="sm" />
              <span className="text-sm">Chargement...</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1 ${emailCount > 0 ? 'text-blue-600 hover:text-blue-800' : 'text-gray-500'}`}>
              <Icon name="ri-mail-line" size="sm" />
              <span className="text-sm font-medium">
                {emailCount > 0 ? `${emailCount} email${emailCount > 1 ? 's' : ''}` : 'Aucune communication'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Email history modal */}
      <ModalSimple title="Historique des emails" open={isModalOpen} onOpenChange={setIsModalOpen} size="large">
        <EmailHistory emails={emails} isLoading={isLoadingEmails} showTitle={false} />
      </ModalSimple>
    </div>
  );
};

export default Gestionnaire;
