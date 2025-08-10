'use client';

import { useState, useEffect, useMemo } from 'react';
import { Home as HomeIcon, Plus, Search, Filter, Download, RefreshCw, Zap, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { cabinCableService, supabase } from '@/lib/supabase';
import { CabinCable } from '@/lib/supabase';
import { dashboardService } from '@/lib/dashboardService';

export default function CabinCableList() {
  // Custom table state
  const [sortColumn, setSortColumn] = useState<keyof CabinCable | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cables, setCables] = useState<CabinCable[]>([]);
  
  // Create unique key for each cable (combines source table and ID to avoid duplicates)
  const getUniqueKey = (cable: CabinCable) => `${cable.source_table}-${cable.id}`;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [availableSystems, setAvailableSystems] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [offlineCableIds, setOfflineCableIds] = useState<Set<string>>(new Set());
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Load offline cable IDs from extracted table
  useEffect(() => {
    const loadOfflineCables = async () => {
      try {
        // Get offline cables directly from extracted table
        const { data: offlineCables, error } = await supabase
          .from('wgc_databasewgc_database_extracted')
          .select('cable_id')
          .eq('online__controller_', 'OFFLINE');
        
        if (error) {
          console.error('Error fetching offline cables:', error);
          return;
        }
        
        // Create set of offline cable IDs
        const offlineIds = new Set<string>();
        if (offlineCables) {
          offlineCables.forEach((cable: { cable_id?: string }) => {
            if (cable.cable_id) {
              offlineIds.add(cable.cable_id);
            }
          });
        }
        
        setOfflineCableIds(offlineIds);
      } catch (error) {
        console.error('Error loading offline cables:', error);
      }
    };

    loadOfflineCables();
  }, []);
  
  // Add column filters (removed filters for: id, area, frame, side, location, system, installed, detail)
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({
    cable_id: '',
    dk: '',
    fz: '',
    primary_cabin__rccl_: '',
    device_name___extension: '',
    device_type__vendor_: '',
    mac_address: '',
    inside_cabin: '',
    user: '',
    beaty_remarks: '',
    cabin_type: '',
    rdp_yard: '',
    cable_origin__switch_: ''
  });

  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      // Get total count first
      const count = await cabinCableService.getCabinCableCount();
      setTotalCount(count);
      
      const data = await cabinCableService.getAllCabinCables();
      
      // Extract unique systems for filtering
      const systems = [...new Set(data.map(cable => cable.system).filter(Boolean))];
      setAvailableSystems(systems);
      
      setCables(data);
    } catch (error) {
      // Silently handle database connection issues and use fallback data
      console.log('Using fallback data due to database connection issue');
      // Fallback to sample data if database is not ready (updated to match CabinCable interface)
      const sampleData = [
        { id: 1, cable_id: 'C20128', area: '002M', dk: '0', fz: '2', frame: '312', side: 'P', location: '20128', system: 'cabin switch', installed: 'yes', mac_address: '-', user: 'CREW', beaty_remarks: '-', rdp_yard: '102B', switch: 'DST1021iL3b', blade_port: 'Gi1/0/8', created_at: '2025-01-01', updated_at: '2025-07-15', source_table: 'pbx' },
        { id: 2, cable_id: 'C20129', area: '002M', dk: '0', fz: '2', frame: '313', side: 'S', location: '20129', system: 'cabin data', installed: 'yes', mac_address: '-', user: 'CREW', beaty_remarks: '-', rdp_yard: '102B', switch: 'DST1021iL3b', blade_port: 'Gi1/0/9', created_at: '2025-02-01', updated_at: '2025-07-01', source_table: 'tv' },
        { id: 3, cable_id: 'C20130', area: '003M', dk: '1', fz: '3', frame: '314', side: 'P', location: '20130', system: 'emergency', installed: 'no', mac_address: '-', user: 'CREW', beaty_remarks: 'pending install', rdp_yard: '103B', switch: 'DST1022iL3b', blade_port: 'Gi1/0/10', created_at: '2025-03-01', updated_at: '2025-03-10', source_table: 'wifi' },
        { id: 4, cable_id: 'C20131', area: '003M', dk: '1', fz: '3', frame: '315', side: 'S', location: '20131', system: 'cabin switch', installed: 'yes', mac_address: '-', user: 'OFFICER', beaty_remarks: '-', rdp_yard: '103B', switch: 'DST1022iL3b', blade_port: 'Gi1/0/11', created_at: '2025-04-01', updated_at: '2025-04-05', source_table: 'pbx' },
        { id: 5, cable_id: 'C20132', area: '004M', dk: '2', fz: '4', frame: '316', side: 'P', location: '20132', system: 'cabin data', installed: 'yes', mac_address: '-', user: 'OFFICER', beaty_remarks: '-', rdp_yard: '104B', switch: 'DST1023iL3b', blade_port: 'Gi1/0/12', created_at: '2025-05-01', updated_at: '2025-06-15', source_table: 'tv' },
      ];
      setCables(sampleData);
      setTotalCount(sampleData.length);
      setAvailableSystems(['System 1', 'System 2', 'System 3']);
    } finally {
      setLoading(false);
    }
  };

  // Filter cables based on global search term and column filters
  const filteredCables = useMemo(() => {

    
    const filtered = cables.filter(cable => {
      // First apply global search filter (only search through visible columns)
      if (searchTerm) {
        const matchesGlobalSearch = 
          (cable.cable_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.dk?.toString() || '').includes(searchTerm.toLowerCase()) ||
          (cable.fz?.toString() || '').includes(searchTerm.toLowerCase()) ||
          (cable.primary_cabin__rccl_?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.device_name___extension?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.device_type__vendor_?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.mac_address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.inside_cabin?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.user?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.beaty_remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.cabin_type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.rdp_yard?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.switch?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.blade_port?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.source_table?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          false;
          
        if (!matchesGlobalSearch) return false;
      }
      
      // Then apply column-specific filters
      for (const [field, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue; // Skip empty filters
        
        const cableValue = String(cable[field as keyof CabinCable] ?? '').toLowerCase();
        const filterNorm = String(filterValue).toLowerCase().trim();
        
        // Exact match for DK to avoid matching DK 12 when filtering DK 2
        if (field === 'dk') {
          if (cableValue !== filterNorm) {
            return false;
          }
          continue;
        }
        
        // Default: substring match
        if (!cableValue.includes(filterNorm)) {
          return false;
        }
      }
      
      return true;
    });
    

    
    return filtered;
  }, [cables, searchTerm, columnFilters]);

  // Define custom table columns aligned with CabinCable interface (removed: ID, Area, Frame, Side, Location, System, Installed, Detail)
  const columns = [
    { header: 'Cable ID', field: 'cable_id' },
    { header: 'DK', field: 'dk', width: '60px' },
    { header: 'FZ', field: 'fz', width: '60px' },
    { header: 'Cabin', field: 'primary_cabin__rccl_' },
    { header: 'Device Name', field: 'device_name___extension' },
    { header: 'Device Type', field: 'device_type__vendor_' },
    { header: 'MAC Address', field: 'mac_address' },
    { header: 'Inside Cabin', field: 'inside_cabin', width: '90px' },
    { header: 'User', field: 'user' },
    { header: 'Remarks', field: 'beaty_remarks' },
    { header: 'Cabin Type', field: 'cabin_type' },
    { header: 'RDP Yard', field: 'rdp_yard' },
    { header: 'Cable Origin Switch', field: 'cable_origin__switch_' },
  ];

  // Custom sort function
  const sortedCables = useMemo(() => {
    let sorted = [...filteredCables];
    
    if (sortColumn) {
      sorted.sort((a, b) => {
        const aValue = a[sortColumn] as string | number;
        const bValue = b[sortColumn] as string | number;
        
        if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aString = String(aValue);
        const bString = String(bValue);
        
        return sortDirection === 'asc' 
          ? aString.localeCompare(bString) 
          : bString.localeCompare(aString);
      });
    }
    

    
    return sorted;
  }, [filteredCables, sortColumn, sortDirection]);
  
  // Pagination logic - no longer needed with AG Grid's built-in pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCables.length);
  const totalPages = Math.ceil(filteredCables.length / itemsPerPage);
  
  // Get current page data
  const currentPageData = useMemo(() => {
    const pageData = sortedCables.slice(startIndex, endIndex);
    return pageData;
  }, [sortedCables, startIndex, endIndex]);

  // Handle sorting
  const handleSort = (field: keyof CabinCable) => {
    if (sortColumn === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field);
      setSortDirection('asc');
    }
  };

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectedRows.size === currentPageData.length) {
      setSelectedRows(new Set()); // Clear selection
    } else {
      // Select all visible rows
      const allRowKeys = new Set<string>();
      currentPageData.forEach(cable => allRowKeys.add(getUniqueKey(cable)));
      setSelectedRows(allRowKeys);
    }
  };

  // Handle row selection toggle
  const handleRowSelect = (cable: CabinCable) => {
    const uniqueKey = getUniqueKey(cable);
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(uniqueKey)) {
      newSelectedRows.delete(uniqueKey);
    } else {
      newSelectedRows.add(uniqueKey);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Load data (previously filtered by system - now using manufacturer as a filter)
  const loadDataBySystem = async (system: string) => {
    try {
      setLoading(true);
      setSelectedSystem(system);
    
    if (system === 'all') {
        await loadData();
        return;
      }
      
      const data = await cabinCableService.getAllCabinCables();
      const filtered = data.filter(cable => cable.system === system);
      const count = await cabinCableService.getCountBySystem(system);
      
      setCables(filtered);
      setTotalCount(count);
    } catch (error) {
      // Silently handle database connection issues
      console.log(`Using fallback data for system ${system} due to database connection issue`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) {
      loadData();
      setMounted(true);
    }
  }, [mounted]);

  return (
    <div className="bg-slate-800 text-white min-h-screen">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white">
            <HomeIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">
              <span className="text-green-500">Beaty</span>
              <span className="text-orange-500">.pro</span>
            </span>
          </div>
        </div>
        
        <div className="flex-grow flex justify-center">
          <h1 className="text-xl font-semibold">Cabin Cable List</h1>
        </div>
        
        {/* Empty div to balance the layout */}
        <div className="w-24"></div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        {/* Toolbar */}
        <div className="bg-slate-700 rounded-lg p-4 mb-6 sticky top-16 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="bg-slate-600 border border-slate-500 rounded px-3 py-2 pl-10 text-sm w-64 focus:outline-none focus:border-blue-500"
                />
              </div>
              

            </div>
            
            <div className="flex items-center space-x-3">
              {/* Export */}
              <button 
                onClick={() => {
                  // Only execute in browser environment
                  if (typeof window !== 'undefined') {
                    // Smart export behavior:
                    // - If rows are selected, export only selected rows
                    // - If no rows are selected, export all filtered data
                    let cablesToExport;
                    
                    if (selectedRows.size > 0) {
                      // Export only selected cables
                      cablesToExport = filteredCables.filter(cable => selectedRows.has(getUniqueKey(cable)));
                      console.log(`Exporting ${cablesToExport.length} selected rows`);
                    } else {
                      // Export all filtered cables
                      cablesToExport = filteredCables;
                      console.log(`Exporting all ${cablesToExport.length} filtered rows`);
                    }
                    
                    if (cablesToExport.length === 0) {
                      alert('No data to export');
                      return;
                    }
                    
                    // Create CSV content
                    const headers = [
                      'Cable ID', 'DK', 'FZ', 'Cabin', 'Device Name',
                      'MAC Address', 'Inside Cabin', 'User', 'Remarks', 'Cabin Type',
                      'RDP Yard', 'Cable Origin Switch'
                    ];
                    
                    const csvContent = [
                      headers.join(','),
                      ...cablesToExport.map(cable => [
                        cable.cable_id || '',
                        cable.dk || '',
                        cable.fz || '',
                        cable.primary_cabin__rccl_ || '',
                        cable.device_name___extension || '',
                        cable.mac_address || '',
                        cable.inside_cabin || '',
                        cable.user || '',
                        (cable.beaty_remarks || '').replace(/,/g, ';'), // Replace commas in text fields
                        cable.cabin_type || '',
                        cable.rdp_yard || '',
                        cable.cable_origin__switch_ || ''
                      ].map(value => `"${value.replace(/"/g, '""')}"`).join(','))
                    ].join('\n');
                    
                    // Create download link
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `cabin-cable-list-${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="bg-teal-600 hover:bg-teal-500 px-3 py-2 rounded text-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              
              {/* Refresh */}
              <button 
                onClick={loadData}
                className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded text-sm flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-700 rounded-lg p-4">
          {/* Custom React Table */}
          {loading ? (
            <div className="mt-8 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading data...</p>
            </div>
          ) : false ? (
            <div className="mt-8 text-center text-slate-400">
              <p>No results found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-slate-800 text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-center">
                    <th className="p-3 w-10 border border-slate-600">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-500"
                        onChange={handleSelectAll}
                        checked={currentPageData.length > 0 && currentPageData.every(cable => selectedRows.has(getUniqueKey(cable)))}
                      />
                    </th>
                    {columns.map((column, index) => (
                      <th key={index} className={`p-3 border border-slate-600 ${column.width ? `w-[${column.width}]` : ''}`}>
                        {/* Column header with sort control */}
                        <div 
                          className="flex items-center justify-center space-x-1 cursor-pointer mb-2"
                          onClick={() => handleSort(column.field as keyof CabinCable)}
                        >
                          <span>{column.header}</span>
                          {sortColumn === column.field && (
                            sortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                          )}
                          {sortColumn !== column.field && (
                            <ChevronsUpDown className="w-4 h-4 opacity-30" />
                          )}
                        </div>
                        {/* Column search input */}
                        <div className="relative text-center">
                          <input
                            type="text"
                            value={columnFilters[column.field as string] || ''}
                            onChange={(e) => {
                              setColumnFilters({
                                ...columnFilters,
                                [column.field]: e.target.value
                              });
                              setCurrentPage(1); // Reset to first page when filtering
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-blue-500 text-center"
                          />
                          <Search className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentPageData && currentPageData.length > 0 ? currentPageData.map((cable, index) => (
                    <tr 
                      key={getUniqueKey(cable)} 
                      className={`border-b border-slate-600 hover:bg-slate-700 ${selectedRows.has(getUniqueKey(cable)) ? 'bg-slate-700 bg-opacity-50' : ''}`}
                    >
                      <td className="p-3 border border-slate-600">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-500"
                          checked={selectedRows.has(getUniqueKey(cable))}
                          onChange={() => handleRowSelect(cable)}
                        />
                      </td>
                      {columns.map((column, index) => {
                        const value = cable[column.field as keyof CabinCable];
                        let displayValue = '';
                        
                        // Format values appropriately based on column type
                        if (value !== undefined && value !== null) {
                          if (column.field === 'length' || column.field === 'diameter') {
                            displayValue = typeof value === 'number' ? value.toFixed(2) : String(value);
                          } else if (column.field === 'installation_date') {
                            try {
                              const date = new Date(String(value));
                              displayValue = date.toLocaleDateString();
                            } catch (e) {
                              displayValue = String(value);
                            }
                          } else {
                            displayValue = String(value);
                          }
                        }
                        
                        // Check if cable is offline using dashboard-based real-time detection
                        // Flash red if cable ID is in the offline cable IDs set from dashboard
                        const isOffline = cable.cable_id && offlineCableIds.has(cable.cable_id);
                        

                        
                        return (
                          <td key={index} className={`p-3 text-center border border-slate-600 ${isOffline ? 'flash-offline' : ''}`}>
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={15} className="p-8 text-center text-slate-400 border border-slate-600">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Custom Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + currentPageData.length, sortedCables.length)} of {sortedCables.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 border rounded ${currentPage === 1 ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    First
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 border rounded ${currentPage === 1 ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button 
                          key={i} 
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 flex items-center justify-center rounded ${currentPage === pageNum ? 'bg-teal-600' : 'hover:bg-slate-600'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 border rounded ${currentPage === totalPages ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    Next
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 border rounded ${currentPage === totalPages ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="mt-4 text-sm text-slate-400">
          Total Records in Database: {totalCount} | 
          Loaded Records: {cables.length} | 
          Filtered Results: {filteredCables.length} | 
          Last Updated: {mounted ? new Date().toLocaleString() : '--'}
        </div>

        {/* Pagination is now handled in the custom table component */}
      </div>
    </div>
  );
}
