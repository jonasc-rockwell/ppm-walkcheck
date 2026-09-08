'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { PlusCircle, FolderPlus, Wrench, Building } from 'lucide-react';

const MAIN_CATEGORIES = [
  { id: 1, name: 'HVAC' },
  { id: 2, name: 'Plumbing' },
  { id: 3, name: 'Electrical' },
  { id: 4, name: 'FDAS' },
];

export default function RLCEquipmentManagement() {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  // Subcategory form state
  const [selectedMainCatForSub, setSelectedMainCatForSub] = useState(1);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Equipment form state
  const [eqName, setEqName] = useState('');
  const [eqNumber, setEqNumber] = useState('');
  const [eqLocation, setEqLocation] = useState('');
  const [eqMainCat, setEqMainCat] = useState(1);
  const [eqSubCat, setEqSubCat] = useState<string>('');
  const [eqQrCode, setEqQrCode] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchData = async () => {
    const { data: subData } = await supabase.from('equipment_subcategories').select('*');
    if (subData) setSubcategories(subData);

    const { data: eqData } = await supabase
      .from('equipment')
      .select('*, equipment_categories(name), equipment_subcategories(name)');
    if (eqData) setEquipmentList(eqData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName) return;

    const { error } = await supabase.from('equipment_subcategories').insert({
      category_id: selectedMainCatForSub,
      name: newSubcategoryName,
    });

    if (error) {
      alert(`Error: ${error.message}`);
    } else {
      setNewSubcategoryName('');
      fetchData();
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('equipment').insert({
      category_id: eqMainCat,
      subcategory_id: eqSubCat ? parseInt(eqSubCat) : null,
      name: eqName,
      equipment_number: eqNumber,
      location: eqLocation,
      qr_code: eqQrCode || `${eqNumber}-${Date.now()}`,
    });

    if (error) {
      alert(`Error adding equipment: ${error.message}`);
    } else {
      setEqName('');
      setEqNumber('');
      setEqLocation('');
      setEqQrCode('');
      setEqSubCat('');
      alert('Equipment registered successfully!');
      fetchData();
    }
  };

  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id === Number(eqMainCat)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <Wrench className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">RLC Asset Management</h1>
          <p className="text-xs text-gray-500">Configure Equipment, Subcategories, and Locations</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FORM 1: Create Subcategory */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-md font-bold flex items-center gap-2 text-gray-800">
            <FolderPlus className="w-5 h-5 text-blue-500" /> Create Subcategory
          </h2>

          <form onSubmit={handleAddSubcategory} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Main Category</label>
              <select
                value={selectedMainCatForSub}
                onChange={(e) => setSelectedMainCatForSub(Number(e.target.value))}
                className="w-full border p-2.5 rounded-lg text-sm bg-gray-50"
              >
                {MAIN_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subcategory Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Chillers, Cooling Towers, Transfer Pumps"
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                className="w-full border p-2.5 rounded-lg text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-slate-700">
              Add Subcategory
            </button>
          </form>
        </div>

        {/* FORM 2: Add New Equipment */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-md font-bold flex items-center gap-2 text-gray-800">
            <PlusCircle className="w-5 h-5 text-emerald-500" /> Register Equipment
          </h2>

          <form onSubmit={handleAddEquipment} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Main Category</label>
                <select
                  value={eqMainCat}
                  onChange={(e) => {
                    setEqMainCat(Number(e.target.value));
                    setEqSubCat('');
                  }}
                  className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                >
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subcategory</label>
                <select
                  value={eqSubCat}
                  onChange={(e) => setEqSubCat(e.target.value)}
                  className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                >
                  <option value="">None / Direct</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Centrifugal Chiller"
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Equipment No. / Tag</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CH-01"
                  value={eqNumber}
                  onChange={(e) => setEqNumber(e.target.value)}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Specific Mall Location</label>
              <input
                type="text"
                required
                placeholder="e.g. Basement 2 Mechanical Room"
                value={eqLocation}
                onChange={(e) => setEqLocation(e.target.value)}
                className="w-full border p-2 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">QR Code ID String</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={eqQrCode}
                onChange={(e) => setEqQrCode(e.target.value)}
                className="w-full border p-2 rounded-lg text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-emerald-700">
              Save Equipment Asset
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}