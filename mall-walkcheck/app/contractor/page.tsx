'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { QrCode, CheckCircle2, ChevronRight, HardHat, Building, LogOut } from 'lucide-react';

const CATEGORY_NAMES: Record<number, string> = {
  1: 'HVAC',
  2: 'Plumbing',
  3: 'Electrical',
  4: 'FDAS',
};

export default function ContractorDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [assignedEquipment, setAssignedEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadContractorData() {
      setLoading(true);

      // 1. Get logged-in user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 2. Fetch user profile info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfile) setProfile(userProfile);

      // 3. Fetch equipment assigned specifically to this contractor
      const { data: assignments } = await supabase
        .from('contractor_assignments')
        .select(`
          equipment (
            id,
            name,
            equipment_number,
            location,
            category_id,
            qr_code,
            equipment_subcategories ( name )
          )
        `)
        .eq('user_id', user.id);

      if (assignments) {
        const eqList = assignments.map((a: any) => a.equipment).filter(Boolean);
        setAssignedEquipment(eqList);
      }

      setLoading(false);
    }

    loadContractorData();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Group equipment by Main Category ID
  const groupedEquipment = assignedEquipment.reduce((acc: any, item: any) => {
    const catId = item.category_id || 1;
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-100 p-4 max-w-md mx-auto pb-16">
      {/* Header Profile Card */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{profile?.full_name || 'Technician'}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Building className="w-3 h-3" /> {profile?.company || 'Contractor'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Assigned Walkcheck Tasks
        </h2>
        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
          {assignedEquipment.length} Assets
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading assigned tasks...</div>
      ) : assignedEquipment.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-2">
          <p className="text-sm font-medium">No Equipment Assigned</p>
          <p className="text-xs text-slate-400">
            Ask RLC or Root Admin to assign equipment IDs to your profile.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.keys(groupedEquipment).map((catId) => {
            const items = groupedEquipment[Number(catId)];
            const categoryName = CATEGORY_NAMES[Number(catId)] || 'Other Equipment';

            return (
              <div key={catId} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {categoryName}
                  </h3>
                </div>

                <div className="space-y-2">
                  {items.map((eq: any) => (
                    <div
                      key={eq.id}
                      onClick={() => router.push(`/inspection/${eq.id}`)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{eq.name}</span>
                          {eq.equipment_number && (
                            <span className="text-[10px] bg-slate-100 font-mono text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {eq.equipment_number}
                            </span>
                          )}
                        </div>

                        {eq.equipment_subcategories?.name && (
                          <p className="text-[11px] font-medium text-blue-600">
                            Subcategory: {eq.equipment_subcategories.name}
                          </p>
                        )}

                        <p className="text-xs text-slate-500">{eq.location}</p>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}