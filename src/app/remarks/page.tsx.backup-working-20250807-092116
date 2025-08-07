'use client';

import { useState, useEffect, useMemo } from 'react';
import { Home as HomeIcon, RefreshCw, ChevronDown, ChevronUp, ChevronsUpDown, Download, Zap, Search } from 'lucide-react';
import Link from 'next/link';
import { dashboardService, DashboardData } from '@/lib/dashboardService';
import { supabase } from '@/lib/supabase';

// Interface for offline cable data
interface OfflineCable {
  id: number;
  cable_id: string;
  dk: string;
  fz: string;
  primary_cabin__rccl_?: string;
  device_name___extension?: string;
  device_type__vendor_?: string;
  mac_address?: string;
  user?: string;
  beaty_remarks?: string;
  system: string;
  source_table: string;
}

export default function RemarksPage() {
  const [offlineCables, setOfflineCables] = useState<OfflineCable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof OfflineCable | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load dashboard data to get offline counts
  const loadDashboardData = async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
      return data;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      return null;
    }
  };

  // Load offline cables by system
  const loadOfflineCablesBySystem = async (system: string) => {
    setLoading(true);
    try {
      const tables = [
        { name: 'wgc_databasewgc_database_pbx', source: 'pbx' },
        { name: 'wgc_databasewgc_database_tv', source: 'tv' },
        { name: 'wgc_databasewgc_database_wifi', source: 'wifi' }
      ];
      
      let allCables: OfflineCable[] = [];
      
      if (system === 'all') {
        // Fetch from all tables
        for (const table of tables) {
          const { data, error } = await supabase
            .from(table.name)
            .select('*')
            .eq('online__controller_', 'OFFLINE');
            
          if (error) {
            console.error(`Error fetching offline cables from ${table.name}:`, error);
            continue;
          }
          
          if (data) {
            // Add source_table to each record
            const processedData = data.map(item => ({
              ...item,
              source_table: table.source,
              system: table.source
            }));
            
            allCables = [...allCables, ...processedData];
          }
        }
      } else {
        // Fetch from specific system
        const tableInfo = tables.find(t => t.source === system);
        if (tableInfo) {
          const { data, error } = await supabase
            .from(tableInfo.name)
            .select('*')
            .eq('online__controller_', 'OFFLINE');
            
          if (error) {
            console.error(`Error fetching offline cables from ${tableInfo.name}:`, error);
          } else if (data) {
            // Add source_table to each record
            allCables = data.map(item => ({
              ...item,
              source_table: tableInfo.source,
              system: tableInfo.source
            }));
          }
        }
      }
      
      console.log(`Loaded ${allCables.length} offline cables for system: ${system}`);
      setOfflineCables(allCables);
    } catch (error) {
      console.error('Error loading offline cables:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      await loadDashboardData();
      await loadOfflineCablesBySystem('all');
    };
    
    loadData();
  }, []);

  // Handle system change
  const handleSystemChange = (system: string) => {
    setSelectedSystem(system);
    loadOfflineCablesBySystem(system);
  };

  // Handle sorting
  const handleSort = (field: keyof OfflineCable) => {
    if (sortColumn === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(field);
      setSortDirection('asc');
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter and sort the cables
  const filteredAndSortedCables = useMemo(() => {
    let result = [...offlineCables];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(cable => {
        // Check all original cable fields
        const originalFieldsMatch = Object.values(cable).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearchTerm)
        );
        
        // Check computed User Type field
        const userType = (cable.primary_cabin__rccl_ && cable.primary_cabin__rccl_ !== '-') ? 'CABIN' : 'PUBLIC';
        const userTypeMatch = userType.toLowerCase().includes(lowerSearchTerm);
        
        return originalFieldsMatch || userTypeMatch;
      });
    }
    
    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === bValue) return 0;
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
        
        // Compare based on type
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // Default numeric comparison
        return sortDirection === 'asc' 
          ? (aValue < bValue ? -1 : 1)
          : (bValue < aValue ? -1 : 1);
      });
    }
    
    return result;
  }, [offlineCables, searchTerm, sortColumn, sortDirection]);
  
  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedCables.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCables = filteredAndSortedCables.slice(startIndex, endIndex);

  // Get system counts
  const systemCounts = useMemo(() => {
    if (!dashboardData) return { pbx: 0, tv: 0, wifi: 0, total: 0 };
    
    return {
      pbx: dashboardData.pbx.offline.total,
      tv: dashboardData.tv.offline.total,
      wifi: dashboardData.wifi.offline.total,
      total: dashboardData.totalOffline
    };
  }, [dashboardData]);

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
          <h1 className="text-xl font-semibold">Offline Cables by System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => loadOfflineCablesBySystem(selectedSystem)}
            className="flex items-center bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => {
              // Only execute in browser environment
              if (typeof window !== 'undefined') {
                // Create CSV content
                const headers = [
                  'Cable ID', 'System', 'DK', 'FZ', 'Cabin',
                  'Device Name', 'MAC Address', 'User', 'Remarks'
                ];
                
                const csvContent = [
                  headers.join(','),
                  ...offlineCables.map((cable: any) => [
                    cable.cable_id || '',
                    cable.system || '',
                    cable.dk || '',
                    cable.fz || '',
                    cable.primary_cabin__rccl_ || '',
                    cable.device_name___extension || '',
                    cable.mac_address || '',
                    cable.user || '',
                    (cable.beaty_remarks || '').replace(/,/g, ';') // Replace commas in text fields
                  ].map(value => `"${value.replace(/"/g, '""')}"`).join(','))
                ].join('\n');
                
                // Create download link
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', `offline-cables-${selectedSystem}-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
            className="flex items-center bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
          >
            <Download className="w-4 h-4 mr-1" />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* System selection and search */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm">Filter by System:</div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleSystemChange('all')}
                className={`px-3 py-1 rounded text-sm ${selectedSystem === 'all' ? 'bg-teal-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                All ({systemCounts.total})
              </button>
              <button
                onClick={() => handleSystemChange('pbx')}
                className={`px-3 py-1 rounded text-sm ${selectedSystem === 'pbx' ? 'bg-teal-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                PBX ({systemCounts.pbx})
              </button>
              <button
                onClick={() => handleSystemChange('tv')}
                className={`px-3 py-1 rounded text-sm ${selectedSystem === 'tv' ? 'bg-teal-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                TV ({systemCounts.tv})
              </button>
              <button
                onClick={() => handleSystemChange('wifi')}
                className={`px-3 py-1 rounded text-sm ${selectedSystem === 'wifi' ? 'bg-teal-600' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                WiFi ({systemCounts.wifi})
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search cables..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 bg-slate-700 rounded w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Cable table */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-600">
                <thead>
                  <tr className="bg-slate-700">
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('cable_id')}>
                      <div className="flex items-center justify-center">
                        Cable ID
                        {sortColumn === 'cable_id' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('system')}>
                      <div className="flex items-center justify-center">
                        System
                        {sortColumn === 'system' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('dk')}>
                      <div className="flex items-center justify-center">
                        DK
                        {sortColumn === 'dk' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('fz')}>
                      <div className="flex items-center justify-center">
                        FZ
                        {sortColumn === 'fz' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('primary_cabin__rccl_')}>
                      <div className="flex items-center justify-center">
                        Cabin
                        {sortColumn === 'primary_cabin__rccl_' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 border border-slate-600">
                      <div className="flex items-center justify-center">
                        User Type
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('device_name___extension')}>
                      <div className="flex items-center justify-center">
                        Device Name
                        {sortColumn === 'device_name___extension' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('mac_address')}>
                      <div className="flex items-center justify-center">
                        MAC Address
                        {sortColumn === 'mac_address' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('user')}>
                      <div className="flex items-center justify-center">
                        User
                        {sortColumn === 'user' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                    <th className="p-3 text-center font-medium text-slate-300 cursor-pointer select-none border border-slate-600" onClick={() => handleSort('beaty_remarks')}>
                      <div className="flex items-center justify-center">
                        Remarks
                        {sortColumn === 'beaty_remarks' ? (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />
                        ) : <ChevronsUpDown className="w-4 h-4 ml-1" />}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCables.length > 0 ? (
                    paginatedCables.map((cable, index) => (
                      <tr 
                        key={`${cable.id}-${cable.source_table}`} 
                        className={`${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700 transition-colors`}
                      >
                        <td className="p-3 text-center border border-slate-600">{cable.cable_id || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.system || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.dk || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.fz || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.primary_cabin__rccl_ || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">
                          {(cable.primary_cabin__rccl_ && cable.primary_cabin__rccl_ !== '-') ? 'CABIN' : 'PUBLIC'}
                        </td>
                        <td className="p-3 text-center border border-slate-600">{cable.device_name___extension || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.mac_address || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.user || '-'}</td>
                        <td className="p-3 text-center border border-slate-600">{cable.beaty_remarks || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 border border-slate-600">
                        {loading ? 'Loading cables...' : 'No offline cables found for the selected criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Pagination */}
              {filteredAndSortedCables.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-4 border-t border-slate-700">
                  <div className="text-sm text-slate-400">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedCables.length)} of {filteredAndSortedCables.length} entries
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
              )}
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="mt-4 text-sm text-slate-400">
          Total Offline Cables: {systemCounts.total} | 
          Selected System: {selectedSystem === 'all' ? 'All Systems' : selectedSystem.toUpperCase()} | 
          PBX: {systemCounts.pbx} | TV: {systemCounts.tv} | WiFi: {systemCounts.wifi} | 
          Last Updated: {dashboardData?.lastUpdated || new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
