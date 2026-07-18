import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Shared applications data + actions for the company's applicant pipeline —
// used by both the full Applicant Pipeline page and the per-job popout panel.
export function useApplicantPipeline() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchApps = useCallback(() => {
    return api.get('/company/applications')
      .then(res => setApps(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleSetSlots = async (appId, slots) => {
    try {
      await api.post(`/company/applications/${appId}/interview-slots`, { slots });
      toast.success('Interview slots saved! Student will be notified.');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slots.');
    }
  };

  const handleAction = async (id, status, extraData = {}) => {
    setUpdating(id);
    try {
      const { offerFile, offerExpiresInDays, ...rest } = extraData;
      await api.put(`/company/applications/${id}`, { status, offerExpiresInDays, ...rest });

      if (status === 'OFFERED' && offerFile) {
        const fd = new FormData();
        fd.append('offerLetter', offerFile);
        await api.post(`/company/applications/${id}/offer-letter`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const labels = { ACCEPTED: 'Interview invitation sent ✓', OFFERED: 'Offer extended ✓', HIRED: 'Candidate hired!', REJECTED: 'Candidate rejected.' };
      toast.success(labels[status] || 'Updated.');
      fetchApps();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setUpdating(null);
    }
  };

  return { apps, loading, updating, fetchApps, handleAction, handleSetSlots };
}
