"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Save, Truck, Package, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  allowDropOff: boolean;
  allowShipping: boolean;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    allowDropOff: true,
    allowShipping: true,
  });

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (e) {
      console.error('Error fetching warehouses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleToggle = async (id: string, field: 'allowDropOff' | 'allowShipping' | 'isActive', value: boolean) => {
    setSaving(id);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value })
      });
      
      if (res.ok) {
        setWarehouses(warehouses.map(wh => 
          wh.id === id ? { ...wh, [field]: value } : wh
        ));
      }
    } catch (e) {
      console.error('Error updating warehouse:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveWarehouse = async () => {
    if (!editingWarehouse) return;
    
    setSaving(editingWarehouse.id);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingWarehouse)
      });
      
      if (res.ok) {
        setWarehouses(warehouses.map(wh => 
          wh.id === editingWarehouse.id ? editingWarehouse : wh
        ));
        setEditingWarehouse(null);
      }
    } catch (e) {
      console.error('Error saving warehouse:', e);
    } finally {
      setSaving(null);
    }
  };

  const handleAddWarehouse = async () => {
    if (!newWarehouse.code || !newWarehouse.name) return;
    
    setSaving('new');
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWarehouse)
      });
      
      if (res.ok) {
        const data = await res.json();
        setWarehouses([...warehouses, data]);
        setShowAddModal(false);
        setNewWarehouse({
          code: "",
          name: "",
          address: "",
          city: "",
          state: "",
          zip: "",
          phone: "",
          allowDropOff: true,
          allowShipping: true,
        });
      }
    } catch (e) {
      console.error('Error adding warehouse:', e);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Edit Warehouse Modal */}
      {editingWarehouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setEditingWarehouse(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Edit Warehouse - {editingWarehouse.code}</h2>
                <button onClick={() => setEditingWarehouse(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label>Name</Label>
                <Input 
                  value={editingWarehouse.name}
                  onChange={e => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  value={editingWarehouse.address || ""}
                  onChange={e => setEditingWarehouse({ ...editingWarehouse, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input 
                    value={editingWarehouse.city || ""}
                    onChange={e => setEditingWarehouse({ ...editingWarehouse, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input 
                    value={editingWarehouse.state || ""}
                    onChange={e => setEditingWarehouse({ ...editingWarehouse, state: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input 
                    value={editingWarehouse.zip || ""}
                    onChange={e => setEditingWarehouse({ ...editingWarehouse, zip: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  value={editingWarehouse.phone || ""}
                  onChange={e => setEditingWarehouse({ ...editingWarehouse, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditingWarehouse(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="purple" 
                  className="flex-1" 
                  onClick={handleSaveWarehouse}
                  disabled={saving === editingWarehouse.id}
                >
                  {saving === editingWarehouse.id ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Warehouse Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Add New Warehouse</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code (e.g. NY)</Label>
                  <Input 
                    value={newWarehouse.code}
                    onChange={e => setNewWarehouse({ ...newWarehouse, code: e.target.value.toUpperCase() })}
                    maxLength={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input 
                    value={newWarehouse.name}
                    onChange={e => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input 
                  value={newWarehouse.address}
                  onChange={e => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>City</Label>
                  <Input 
                    value={newWarehouse.city}
                    onChange={e => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input 
                    value={newWarehouse.state}
                    onChange={e => setNewWarehouse({ ...newWarehouse, state: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input 
                    value={newWarehouse.zip}
                    onChange={e => setNewWarehouse({ ...newWarehouse, zip: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newWarehouse.allowDropOff}
                    onChange={e => setNewWarehouse({ ...newWarehouse, allowDropOff: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Allow Drop-off</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newWarehouse.allowShipping}
                    onChange={e => setNewWarehouse({ ...newWarehouse, allowShipping: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Allow Shipping</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="purple" 
                  className="flex-1" 
                  onClick={handleAddWarehouse}
                  disabled={saving === 'new' || !newWarehouse.code || !newWarehouse.name}
                >
                  {saving === 'new' ? "Adding..." : "Add Warehouse"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Manage warehouses and delivery options</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouses */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Warehouses
          </h2>
        </div>
        
        <div className="divide-y divide-slate-100">
          {warehouses.map((wh) => (
            <div key={wh.id} className={`p-4 ${!wh.isActive ? 'bg-slate-50 opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wh.isActive ? 'bg-queens-purple text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <span className="font-bold">{wh.code}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{wh.name}</p>
                    {wh.address && (
                      <p className="text-sm text-slate-500">{wh.address}, {wh.city}, {wh.state} {wh.zip}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {wh.allowDropOff && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                          <Package className="w-3 h-3" />
                          Drop-off
                        </span>
                      )}
                      {wh.allowShipping && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Truck className="w-3 h-3" />
                          Shipping
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Toggles */}
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={wh.allowDropOff}
                        onChange={e => handleToggle(wh.id, 'allowDropOff', e.target.checked)}
                        disabled={saving === wh.id}
                        className="rounded text-queens-purple"
                      />
                      <span className="text-slate-600">Drop-off</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={wh.allowShipping}
                        onChange={e => handleToggle(wh.id, 'allowShipping', e.target.checked)}
                        disabled={saving === wh.id}
                        className="rounded text-queens-purple"
                      />
                      <span className="text-slate-600">Shipping</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={wh.isActive}
                        onChange={e => handleToggle(wh.id, 'isActive', e.target.checked)}
                        disabled={saving === wh.id}
                        className="rounded text-queens-purple"
                      />
                      <span className="text-slate-600">Active</span>
                    </label>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingWarehouse(wh)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {warehouses.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No warehouses configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
        <p className="font-medium text-slate-900 mb-2">Configuration Guide:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Drop-off:</strong> Vendors can visit this location in person</li>
          <li><strong>Shipping:</strong> Vendors can ship to this location</li>
          <li><strong>Active:</strong> Warehouse is available for new commitments</li>
        </ul>
      </div>
    </div>
  );
}
