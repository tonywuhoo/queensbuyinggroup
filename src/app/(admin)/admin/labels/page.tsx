"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Check, X, Clock, Package, Upload, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface LabelFile {
  name: string;
  url: string;
  uploadedAt: string;
}

interface LabelRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  labelUrl?: string;
  labelFiles?: LabelFile[];
  notes?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    vendorNumber: number;
  };
  deal: {
    title: string;
    freeLabelMin?: number;
  };
  commitment: {
    id: string;
    quantity: number;
    warehouse: string;
  };
}

export default function AdminLabelsPage() {
  const [requests, setRequests] = useState<LabelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LabelRequest | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<LabelFile[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const res = await fetch('/api/admin/labels');
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (e) {
        console.error('Error fetching labels:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLabels();
  }, []);

  const filteredRequests = requests.filter(r => 
    filter === "ALL" || r.status === filter
  );

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  const uploadFiles = async (files: FileList | File[]) => {
    if (!files.length || !selectedRequest) return;
    
    setUploading(true);
    setUploadError("");
    
    const supabase = createClient();
    const newFiles: LabelFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${selectedRequest.id}/${Date.now()}-${file.name}`;
      
      try {
        console.log('Uploading to bucket "labels", path:', fileName);
        
        const { data, error } = await supabase.storage
          .from('labels')
          .upload(fileName, file);
        
        if (error) {
          console.error('Upload error:', error);
          setUploadError(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        
        console.log('Upload success, data:', data);
        
        // Use the path from the upload response
        const filePath = data?.path || fileName;
        
        // Store URL pointing to our API proxy (secure)
        const proxyUrl = `/api/files/labels/${filePath}`;
        
        newFiles.push({
          name: file.name,
          url: proxyUrl,
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError(`Failed to upload ${file.name}`);
      }
    }
    
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setUploading(false);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await uploadFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleApprove = async () => {
    if (!selectedRequest || uploadedFiles.length === 0) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/labels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'APPROVED',
          labelFiles: uploadedFiles
        })
      });

      if (res.ok) {
        setRequests(requests.map(r =>
          r.id === selectedRequest.id
            ? { ...r, status: "APPROVED" as const, labelFiles: uploadedFiles }
            : r
        ));
        closeModal();
      }
    } catch (e) {
      console.error('Error approving label:', e);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/labels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'REJECTED',
          notes: rejectReason
        })
      });

      if (res.ok) {
        setRequests(requests.map(r =>
          r.id === selectedRequest.id
            ? { ...r, status: "REJECTED" as const, notes: rejectReason }
            : r
        ));
        closeModal();
      }
    } catch (e) {
      console.error('Error rejecting label:', e);
    } finally {
      setProcessing(false);
    }
  };

  const closeModal = () => {
    setProcessModalOpen(false);
    setSelectedRequest(null);
    setUploadedFiles([]);
    setRejectReason("");
    setUploadError("");
  };

  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Label Requests</h1>
          <p className="text-slate-500 text-sm">
            {pendingCount > 0 ? (
              <span className="text-yellow-600 font-medium">{pendingCount} pending requests</span>
            ) : (
              "No pending requests"
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? "bg-queens-purple text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            {status === "PENDING" && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.map((request) => (
          <div
            key={request.id}
            className={`bg-white rounded-xl border p-4 lg:p-5 ${
              request.status === "PENDING" ? "border-yellow-200" : "border-slate-200"
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                    {request.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-queens-purple/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-queens-purple font-bold text-sm">
                      {request.user.firstName[0]}{request.user.lastName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {request.user.firstName} {request.user.lastName}
                      <span className="ml-2 font-mono text-xs text-queens-purple">
                        U-{String(request.user.vendorNumber).padStart(5, '0')}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500">{request.user.email}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 mt-3">
                  <p className="font-medium text-slate-900">{request.deal.title}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Qty: {request.commitment.quantity}
                    </span>
                    <span>Warehouse: {request.commitment.warehouse}</span>
                    {request.deal.freeLabelMin && (
                      <span className={request.commitment.quantity >= request.deal.freeLabelMin ? "text-green-600" : "text-orange-600"}>
                        {request.commitment.quantity >= request.deal.freeLabelMin ? "✓ Free label" : `Needs ${request.deal.freeLabelMin}+`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:min-w-[160px]">
                {request.status === "PENDING" && (
                  <Button onClick={() => { setSelectedRequest(request); setProcessModalOpen(true); }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Process
                  </Button>
                )}
                {request.status === "APPROVED" && (request.labelFiles?.length || request.labelUrl) && (
                  <div className="space-y-2">
                    {request.labelFiles?.map((file, idx) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="block">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <Download className="w-3 h-3 mr-1" />
                          {file.name.length > 20 ? file.name.slice(0, 20) + '...' : file.name}
                        </Button>
                      </a>
                    ))}
                    {!request.labelFiles?.length && request.labelUrl && (
                      <a href={request.labelUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">View Label</Button>
                      </a>
                    )}
                  </div>
                )}
                {request.status === "REJECTED" && request.notes && (
                  <p className="text-sm text-red-600">Reason: {request.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {filter.toLowerCase()} label requests</p>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {processModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Process Label Request</h2>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <p className="font-medium text-slate-900">{selectedRequest.deal.title}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {selectedRequest.user.firstName} {selectedRequest.user.lastName} - Qty: {selectedRequest.commitment.quantity}
                </p>
                <p className="text-sm text-slate-500">
                  Warehouse: {selectedRequest.commitment.warehouse}
                </p>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Check className="w-4 h-4 inline mr-1 text-green-600" />
                  Upload Label Files
                </label>
                
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? "border-queens-purple bg-queens-purple/5 scale-[1.02]" 
                      : "border-slate-200 hover:border-queens-purple"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? "text-queens-purple" : "text-slate-400"}`} />
                  <p className={`text-sm transition-colors ${isDragging ? "text-queens-purple font-medium" : "text-slate-600"}`}>
                    {isDragging ? "Drop files here!" : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG supported - Multiple files allowed</p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {uploading && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-queens-purple">
                    <div className="w-4 h-4 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}
                
                {uploadError && (
                  <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                )}
                
                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-green-600 shrink-0" />
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={handleApprove} 
                  disabled={uploadedFiles.length === 0 || processing} 
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                >
                  {processing ? "Processing..." : `Approve with ${uploadedFiles.length} file(s)`}
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <X className="w-4 h-4 inline mr-1 text-red-600" />
                  Reject (optional reason)
                </label>
                <input
                  type="text"
                  placeholder="Reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
                <Button onClick={handleReject} disabled={processing} variant="destructive" className="w-full mt-3">
                  Reject
                </Button>
              </div>

              <button onClick={closeModal} className="w-full mt-4 px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
