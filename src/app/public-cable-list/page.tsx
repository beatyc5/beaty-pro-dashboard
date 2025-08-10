'use client';

import { useState, useEffect, useMemo } from 'react';
import { Home as HomeIcon, Plus, Search, Filter, Download, RefreshCw, Zap, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { cableService, Cable } from '@/lib/supabase';
import { dashboardService, DashboardData } from '@/lib/dashboardService';

// Using the global flash-offline class from globals.css for flashing red animation

export default function PublicCableList() {
  // Custom table state
  const [sortColumn, setSortColumn] = useState<keyof Cable | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [cables, setCables] = useState<Cable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [availableSystems, setAvailableSystems] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [offlineCableIds, setOfflineCableIds] = useState<Set<string>>(new Set());

  // Add column filters
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string}>({
    id: '',
    cable_id: '',
    area: '',
    dk: '',
    fz: '',
    frame: '',
    side: '',
    location: '',
    system: '',
    installed: '',
    mac_address: '',
    user: '',
    beaty_remarks: '',
    rdp_yard: '',
    switch: '',
    blade_port: ''
  });

  // Load dashboard data to identify offline devices
  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data for offline devices...');
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      console.log('Dashboard data loaded:', data);
      
      // Extract cable IDs of offline devices from public spaces
      const offlineIds = new Set<string>();
      
      // Process WiFi offline devices
      if (data.wifi && data.wifi.offline) {
        const publicOfflineCount = data.wifi.offline.publicCrew + data.wifi.offline.publicPax;
        if (publicOfflineCount > 0) {
          // We need to fetch the actual cable IDs from the WiFi table
          // Using type assertion to handle the method that was added to cableService
          const getOfflineWifiCables = (cableService as any).getOfflineWifiCables;
          const wifiData = getOfflineWifiCables ? await getOfflineWifiCables() : [];
          wifiData.forEach((cable: Cable) => {
            if (cable.cable_id) offlineIds.add(cable.cable_id);
          });
        }
      }
      
      // Process PBX offline devices
      if (data.pbx && data.pbx.offline) {
        const publicOfflineCount = data.pbx.offline.publicCrew + data.pbx.offline.publicPax;
        if (publicOfflineCount > 0) {
          // We need to fetch the actual cable IDs from the PBX table
          // Using type assertion to handle the method that was added to cableService
          const getOfflinePbxCables = (cableService as any).getOfflinePbxCables;
          const pbxData = getOfflinePbxCables ? await getOfflinePbxCables() : [];
          pbxData.forEach((cable: Cable) => {
            if (cable.cable_id) offlineIds.add(cable.cable_id);
          });
        }
      }
      
      // Process TV offline devices
      if (data.tv && data.tv.offline) {
        const publicOfflineCount = data.tv.offline.publicCrew + data.tv.offline.publicPax;
        if (publicOfflineCount > 0) {
          // We need to fetch the actual cable IDs from the TV table
          // Using type assertion to handle the method that was added to cableService
          const getOfflineTvCables = (cableService as any).getOfflineTvCables;
          const tvData = getOfflineTvCables ? await getOfflineTvCables() : [];
          tvData.forEach((cable: Cable) => {
            if (cable.cable_id) offlineIds.add(cable.cable_id);
          });
        }
      }
      
      setOfflineCableIds(offlineIds);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  
  // Load data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from Supabase...');
      
      // Get total count first
      const count = await cableService.getCableCount();
      setTotalCount(count);
      console.log('Total records in database:', count);
      
      const data = await cableService.getAllCables();
      console.log('Data loaded:', data);
      console.log('Records returned:', data.length);
      console.log('First record structure:', data[0]);
      console.log('Last record structure:', data[data.length - 1]);
      console.log('All available fields:', Object.keys(data[0] || {}));
      console.log('Field names:', Object.keys(data[0] || {}).join(', '));
      
      // Get systems for filtering
      const systems = [...new Set(data.map(item => item.system))].filter(Boolean);
      setAvailableSystems(systems);
      console.log('Systems extracted:', systems);
      
      setCables(data);
    } catch (error) {
      console.error('Error loading cables:', error);
      console.log('Using fallback sample data...');
      // Fallback to sample data if database is not ready (updated to match Cable interface)
      const sampleData = [
        { id: 1, cable_id: 'C20128', area: '002M', dk: '0', fz: '2', frame: '312', side: 'P', location: '20128', system: 'cabin switch', installed: 'yes', mac_address: '-', user: 'CREW', beaty_remarks: '-', rdp_yard: '102B', switch: 'DST1021iL3b', blade_port: 'Gi1/0/8', device_name___extension: 'CABIN-0128', created_at: '2025-01-01', updated_at: '2025-07-15' },
        { id: 2, cable_id: 'C20129', area: '002M', dk: '0', fz: '2', frame: '313', side: 'S', location: '20129', system: 'cabin data', installed: 'yes', mac_address: '-', user: 'CREW', beaty_remarks: '-', rdp_yard: '102B', switch: 'DST1021iL3b', blade_port: 'Gi1/0/9', device_name___extension: 'CABIN-0129', created_at: '2025-02-01', updated_at: '2025-07-01' },
        { id: 3, cable_id: 'C20130', area: '003M', dk: '1', fz: '3', frame: '314', side: 'P', location: '20130', system: 'emergency', installed: 'no', mac_address: '-', user: 'CREW', beaty_remarks: 'pending install', rdp_yard: '103B', switch: 'DST1022iL3b', blade_port: 'Gi1/0/10', device_name___extension: 'EMERG-0130', created_at: '2025-03-01', updated_at: '2025-03-10' },
        { id: 4, cable_id: 'C20131', area: '003M', dk: '1', fz: '3', frame: '315', side: 'S', location: '20131', system: 'cabin switch', installed: 'yes', mac_address: '-', user: 'OFFICER', beaty_remarks: '-', rdp_yard: '103B', switch: 'DST1022iL3b', blade_port: 'Gi1/0/11', device_name___extension: 'CABIN-0131', created_at: '2025-04-01', updated_at: '2025-04-05' },
        { id: 5, cable_id: 'C20132', area: '004M', dk: '2', fz: '4', frame: '316', side: 'P', location: '20132', system: 'cabin data', installed: 'yes', mac_address: '-', user: 'OFFICER', beaty_remarks: '-', rdp_yard: '104B', switch: 'DST1023iL3b', blade_port: 'Gi1/0/12', device_name___extension: 'CABIN-0132', created_at: '2025-05-01', updated_at: '2025-06-15' },
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
    return cables.filter(cable => {
      // First apply global search if specified
      if (searchTerm) {
        const matchesGlobalSearch = 
          (cable.id?.toString().toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.cable_id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.area?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.dk?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.fz?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.frame?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.side?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.location?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.system?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          // Include device name in global search
          ((cable as any).device_name___extension?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.installed?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.mac_address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.user?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.beaty_remarks?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.rdp_yard?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.switch?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (cable.blade_port?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          false;
          
        if (!matchesGlobalSearch) return false;
      }
      
      // Then apply column-specific filters
      for (const [field, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue; // Skip empty filters
        
        const cableValue = String(cable[field as keyof Cable] ?? '').toLowerCase();
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
  }, [cables, searchTerm, columnFilters]);

  // Define custom table columns aligned with Cable interface
  const columns = [
    { header: 'Cable ID', field: 'cable_id' },
    { header: 'DK', field: 'dk', width: '60px' },
    { header: 'FZ', field: 'fz', width: '60px' },
    { header: 'Frame', field: 'frame', width: '80px' },
    { header: 'Side', field: 'side', width: '60px' },
    { header: 'Location', field: 'location' },
    { header: 'System', field: 'system' },
    { header: 'DEVICE NAME', field: 'device_name___extension' },
    { header: 'Installed', field: 'installed', width: '90px' },
    { header: 'MAC Address', field: 'mac_address' },
    { header: 'User', field: 'user' },
    { header: 'Remarks', field: 'beaty_remarks' },
    { header: 'RDP Yard', field: 'rdp_yard' },
    { header: 'Switch', field: 'switch' },
    { header: 'Blade Port', field: 'blade_port' },
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
    return sortedCables.slice(startIndex, endIndex);
  }, [sortedCables, startIndex, endIndex]);

  // Handle sorting
  const handleSort = (field: keyof Cable) => {
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
      const allRowIds = new Set<number>();
      currentPageData.forEach(cable => allRowIds.add(cable.id));
      setSelectedRows(allRowIds);
    }
  };

  // Handle row selection toggle
  const handleRowSelect = (id: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(id)) {
      newSelectedRows.delete(id);
    } else {
      newSelectedRows.add(id);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Load data (previously filtered by system - now using manufacturer as a filter)
  // Initialize data on component mount
  useEffect(() => {
    const initialize = async () => {
      await loadData();
      await loadDashboardData();
      setMounted(true);
    };
    
    initialize();
  }, []);
  
  const loadDataBySystem = async (system: string) => {
    try {
      setLoading(true);
      setSelectedSystem(system);
    
      if (system === 'all') {
        await loadData();
        return;
      }
      
      console.log(`Loading data for system: ${system}`);
      // Filter by system instead since getCablesBySystem isn't compatible with the actual Cable interface
      const data = await cableService.getAllCables();
      const filtered = data.filter(cable => cable.system === system);
      const count = await cableService.getCountBySystem(system);
      
      console.log(`Found ${filtered.length} cables for system: ${system}`);
      console.log(`Total count for system: ${count}`);
      
      setCables(filtered);
      setTotalCount(count);
    } catch (error) {
      console.error(`Error loading cables for system ${system}:`, error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-800 text-white">
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
          <h1 className="text-xl font-semibold">Public Cable List</h1>
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
                  placeholder=""
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
                      cablesToExport = filteredCables.filter(cable => selectedRows.has(cable.id));
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
                      'Cable ID', 'Area', 'DK', 'FZ', 'Frame', 'Side', 
                      'Location', 'System', 'Installed', 'MAC Address', 
                      'User', 'Remarks', 'RDP Yard', 'Switch', 'Blade Port'
                    ];
                    
                    const csvContent = [
                      headers.join(','),
                      ...cablesToExport.map(cable => [
                        cable.cable_id || '',
                        cable.area || '',
                        cable.dk || '',
                        cable.fz || '',
                        cable.frame || '',
                        cable.side || '',
                        cable.location || '',
                        cable.system || '',
                        cable.installed || '',
                        cable.mac_address || '',
                        cable.user || '',
                        (cable.beaty_remarks || '').replace(/,/g, ';'), // Replace commas in text fields
                        cable.rdp_yard || '',
                        cable.switch || '',
                        cable.blade_port || ''
                      ].map(value => `"${value.replace(/"/g, '""')}"`).join(','))
                    ].join('\n');
                    
                    // Create download link
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `public-cable-list-${new Date().toISOString().split('T')[0]}.csv`);
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

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setColumnFilters({
                    id: '',
                    cable_id: '',
                    area: '',
                    dk: '',
                    fz: '',
                    frame: '',
                    side: '',
                    location: '',
                    system: '',
                    installed: '',
                    mac_address: '',
                    user: '',
                    beaty_remarks: '',
                    rdp_yard: '',
                    switch: '',
                    blade_port: ''
                  });
                  setCurrentPage(1);
                }}
                className="bg-slate-600 hover:bg-slate-500 px-3 py-2 rounded text-sm"
                aria-label="Clear all filters"
              >
                Clear Filters
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
          ) : (
            <div className="overflow-x-auto w-full">
              {/* Using global flash-offline class from globals.css */}
              <table className="min-w-full bg-slate-800 text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-center">
                    <th className="p-3 w-10 border border-slate-600">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-500"
                        onChange={handleSelectAll}
                        checked={currentPageData.length > 0 && currentPageData.every(cable => selectedRows.has(cable.id))}
                        aria-label="Select all visible rows"
                      />
                    </th>
                    {columns.map((column, index) => (
                      <th key={index} className={`p-3 border border-slate-600 ${column.width ? `w-[${column.width}]` : ''}`}>
                        {/* Column header with sort control */}
                        <div 
                          className="flex items-center justify-center space-x-1 cursor-pointer mb-2"
                          onClick={() => handleSort(column.field as keyof Cable)}
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
                            placeholder=""
                            value={columnFilters[column.field as string] || ''}
                            onChange={(e) => {
                              setColumnFilters({
                                ...columnFilters,
                                [column.field]: e.target.value
                              });
                              setCurrentPage(1); // Reset to first page when filtering
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-blue-500"
                            aria-label={`Filter by ${column.header}`}
                          />
                          <Search className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCables.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-6 text-center text-slate-400">
                        No results found. Adjust or clear filters to see data.
                      </td>
                    </tr>
                  ) : (
                    currentPageData.map((cable) => (
                      <tr 
                        key={cable.id} 
                        className={`border-b border-slate-600 hover:bg-slate-700 ${selectedRows.has(cable.id) ? 'bg-slate-700 bg-opacity-50' : ''}`}
                      >
                        <td className="p-3 text-center border border-slate-600">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-500"
                            checked={selectedRows.has(cable.id)}
                            onChange={() => handleRowSelect(cable.id)}
                            aria-label={`Select row for cable ${String(cable.cable_id || cable.id)}`}
                          />
                        </td>
                        {columns.map((column, index) => {
                          const value = cable[column.field as keyof Cable];
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
                          
                          // Apply flash-offline class to cells when cable is offline
                          const cableAny = cable as any;
                          const onlineController = cableAny.online__controller_ || cableAny['online__controller_'] || cableAny.online_controller;
                          const isOffline = onlineController === 'OFFLINE' || onlineController === false || onlineController === 'false' || onlineController === 'no' || onlineController === 0;
                          
                          return (
                            <td 
                              key={index} 
                              className={`p-3 text-center border border-slate-600 ${isOffline ? 'flash-offline' : ''}`}
                            >
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {/* Custom Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {filteredCables.length === 0 ? 0 : startIndex + 1} to {filteredCables.length === 0 ? 0 : Math.min(endIndex, filteredCables.length)} of {filteredCables.length} entries
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || filteredCables.length === 0}
                    className={`px-3 py-2 border rounded ${(currentPage === 1 || filteredCables.length === 0) ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    First
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || filteredCables.length === 0}
                    className={`px-3 py-2 border rounded ${(currentPage === 1 || filteredCables.length === 0) ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, Math.max(1, totalPages)) }, (_, i) => {
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
                          disabled={filteredCables.length === 0}
                          className={`w-10 h-10 flex items-center justify-center rounded ${currentPage === pageNum ? 'bg-teal-600' : 'hover:bg-slate-600'} ${filteredCables.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || filteredCables.length === 0}
                    className={`px-3 py-2 border rounded ${(currentPage === totalPages || filteredCables.length === 0) ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
                  >
                    Next
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || filteredCables.length === 0}
                    className={`px-3 py-2 border rounded ${(currentPage === totalPages || filteredCables.length === 0) ? 'border-slate-600 text-slate-500' : 'border-slate-500 hover:bg-slate-600'}`}
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
          Last Updated: {mounted ? new Date().toLocaleString() : 'Loading...'}
        </div>
      </div>
    </div>
  );
}