// Re-export helpers from the unified Supabase client without creating a client at module scope
import { getBrowserClient } from './supabaseClient';

// Backwards-compatible accessor that lazily returns the browser client.
// Avoids SSR/null issues and prevents repeated "Failed to get browser client" logs.
export const getSupabase = () => getBrowserClient();
// Maintain a module-level reference for internal helper functions in this file
// Guarded to only instantiate on the client to avoid SSR issues
export const supabase = (typeof window !== 'undefined' ? getBrowserClient() : null) as any;

// Auth utilities
export const signOut = async () => {
  try {
    const supabase = getBrowserClient();
    if (!supabase) {
      throw new Error('No browser client available');
    }
    // First clear any local storage tokens that might be keeping the session alive
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-access-token');
    
    // Then perform the actual signOut
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error)
    }
    
    console.log('Signing out and redirecting to /auth/signin')
    
    // Hard redirect to login page
    window.location.replace('/auth/signin')
    
    return { error }
  } catch (e) {
    console.error('Exception during sign out:', e)
    // Fallback redirect
    window.location.href = '/auth/signin'
    return { error: e }
  }
}

export const getCurrentUser = async () => {
  const supabase = getBrowserClient();
  if (!supabase) {
    return { user: null, error: new Error('No browser client available') };
  }
  const { data: { session }, error } = await supabase.auth.getSession()
  return { user: session?.user ?? null, error }
}


// Database table interface for cables - Updated to match actual database structure
export interface Cable {
  id: number;
  cable_id: string;
  area: string;
  dk: string;
  fz: string;
  frame: string;
  side: string;
  location: string;
  system: string;
  installed: string;
  mac_address: string;
  user: string;
  beaty_remarks: string;
  rdp_yard: string;
  switch: string;
  blade_port: string;
  device_name___extension?: string;
  created_at?: string;
  updated_at?: string;
}

// Database functions for cable operations
export const cableService = {
  // Get all cables with pagination to handle large datasets
  async getAllCables(): Promise<Cable[]> {
    console.log('Fetching all cables from Supabase with pagination...');
    
    const allCables: Cable[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000; // Supabase's default limit
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching page ${page + 1}: records ${from + 1} to ${to + 1}`);
      
      const { data, error } = await supabase
        .from('wgc_databasewgc_database_field_cables')
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);
      
      if (error) {
        console.error(`Error fetching page ${page + 1}:`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Process data to ensure device_name___extension field is available
        const processedData = data.map((item: any) => ({
          ...item,
          // Add device_name___extension field if not present
          device_name___extension: item.device_name___extension || `${item.system}-${item.cable_id}` || ''
        }));
        
        allCables.push(...processedData);
        console.log(`Page ${page + 1}: Got ${data.length} records`);
        
        // Check if we got a full page (means there might be more)
        if (data.length < pageSize) {
          hasMore = false;
          console.log(`Page ${page + 1} has ${data.length} records (less than ${pageSize}), stopping pagination`);
        }
      } else {
        hasMore = false;
        console.log(`Page ${page + 1}: No more data`);
      }
      
      page++;
      
      // Safety check to prevent infinite loops
      if (page > 20) {
        console.warn('Reached maximum page limit (20), stopping pagination');
        break;
      }
    }
    
    console.log(`Total records fetched: ${allCables.length}`);
    
    // Log the systems in the returned data
    if (allCables.length > 0) {
      const returnedSystems = [...new Set(allCables.map(item => item.system).filter(Boolean))];
      console.log('Systems in returned data:', returnedSystems);
      console.log('First few records:', allCables.slice(0, 3));
      console.log('Last few records:', allCables.slice(-3));
    }
    
    return allCables;
  },

  // Get cable by ID
  async getCableById(id: string): Promise<Cable | null> {
    const { data, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching cable:', error);
      throw error;
    }
    
    return data;
  },

  // Create new cable
  async createCable(cable: Omit<Cable, 'id' | 'created_at' | 'updated_at'>): Promise<Cable> {
    const { data, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .insert([cable])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating cable:', error);
      throw error;
    }
    
    return data;
  },

  // Update cable
  async updateCable(id: string, updates: Partial<Cable>): Promise<Cable> {
    const { data, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating cable:', error);
      throw error;
    }
    
    return data;
  },

  // Delete cable
  async deleteCable(id: string): Promise<void> {
    const { error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting cable:', error);
      throw error;
    }
  },

  // Search cables
  async searchCables(searchTerm: string): Promise<Cable[]> {
    const { data, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*')
      .or(`cable_name.ilike.%${searchTerm}%,cable_type.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error searching cables:', error);
      throw error;
    }
    
    return data || [];
  },

  // Get total count of cables
  async getCableCount(): Promise<number> {
    const { count, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error getting cable count:', error);
      throw error;
    }
    
    return count || 0;
  },

  // Get cables by system with pagination
  async getCablesBySystem(system: string): Promise<Cable[]> {
    console.log(`Fetching all cables for system: ${system}`);
    
    const allCables: Cable[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from('wgc_databasewgc_database_field_cables')
        .select('*')
        .eq('system', system)
        .order('id', { ascending: true })
        .range(from, to);
      
      if (error) {
        console.error(`Error fetching page ${page + 1} for system ${system}:`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        allCables.push(...data);
        
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      page++;
      
      if (page > 20) {
        console.warn(`Reached maximum page limit for system ${system}`);
        break;
      }
    }
    
    console.log(`Found ${allCables.length} total cables for system: ${system}`);
    return allCables;
  },

  // Get count by system
  async getCountBySystem(system: string): Promise<number> {
    const { count, error } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*', { count: 'exact', head: true })
      .eq('system', system);
    
    if (error) {
      console.error(`Error getting count for system ${system}:`, error);
      throw error;
    }
    
    return count || 0;
  }
}; 

// Database table interface for cabin cables (PBX, TV, WiFi combined)
export interface CabinCable {
  id: number;
  cable_id: string;
  area: string;
  dk: string;
  fz: string;
  frame?: string;
  side?: string;
  location?: string;
  primary_cabin__rccl_?: string;
  system: string;
  installed?: string;
  device_name___extension?: string;
  device_type__vendor_?: string;
  detail?: string;
  mac_address?: string;
  inside_cabin?: string;
  user?: string;
  beaty_remarks?: string;
  cabin_type?: string;
  online__controller_?: string;
  online__at_once_?: string;
  col_1st_sea_trial___green_zone?: string;
  cable_origin__switch_?: string;
  rdp_yard?: string;
  switch?: string;
  blade_port?: string;
  created_at?: string;
  updated_at?: string;
  source_table: string; // Indicates which table this came from: 'pbx', 'tv', or 'wifi'
}

// Header normalization function to map different table schemas to common format
function normalizeRecord(record: any, sourceTable: string): CabinCable {
  // Define the mapping for each table's headers to our common schema
  const fieldMappings: { [key: string]: { [key: string]: string } } = {
    pbx: {
      // Map PBX table fields to common schema
      cable_id: 'cable_id',
      dk: 'dk',
      fz: 'fz',
      primary_cabin__rccl_: 'primary_cabin__rccl_',
      device_name___extension: 'device_name___extension',
      device_type__vendor_: 'device_type__vendor_',
      mac_address: 'mac_address',
      inside_cabin: 'inside_cabin',
      user: 'user',
      beaty_remarks: 'beaty_remarks',
      cabin_type: 'cabin_type',
      rdp_yard: 'rdp_yard',
      cable_origin__switch_: 'cable_origin__switch_'
    },
    tv: {
      // Map TV table fields to common schema
      cable_id: 'cable_id',
      dk: 'dk',
      fz: 'fz',
      primary_cabin__rccl_: 'primary_cabin__rccl_',
      device_name___extension: 'device_name___extension',
      device_type__vendor_: 'device_type__vendor_',
      mac_address: 'mac_address',
      inside_cabin: 'inside_cabin',
      user: 'user',
      beaty_remarks: 'beaty_remarks',
      cabin_type: 'cabin_type',
      rdp_yard: 'rdp_yard',
      cable_origin__switch_: 'cable_origin__switch_'
    },
    wifi: {
      // Map WiFi table fields to common schema
      cable_id: 'cable_id',
      dk: 'dk',
      fz: 'fz',
      primary_cabin__rccl_: 'primary_cabin__rccl_',
      device_name___extension: 'device_name___extension',
      device_type__vendor_: 'device_type__vendor_',
      mac_address: 'mac_address',
      inside_cabin: 'inside_cabin',
      user: 'user',
      beaty_remarks: 'beaty_remarks',
      cabin_type: 'cabin_type',
      rdp_yard: 'rdp_yard',
      cable_origin__switch_: 'cable_origin__switch_'
    }
  };
  
  const mapping = fieldMappings[sourceTable] || fieldMappings.wifi;
  
  // Create normalized record with only the requested columns
  const normalized: CabinCable = {
    id: record.id,
    cable_id: record[mapping.cable_id] || '',
    area: record.area || '', // Include area field
    dk: record[mapping.dk] || '',
    fz: record[mapping.fz] || '',
    primary_cabin__rccl_: record[mapping.primary_cabin__rccl_] || '',
    device_name___extension: record[mapping.device_name___extension] || '',
    device_type__vendor_: record[mapping.device_type__vendor_] || '',
    mac_address: record[mapping.mac_address] || '',
    inside_cabin: record[mapping.inside_cabin] || '',
    user: record[mapping.user] || '',
    beaty_remarks: record[mapping.beaty_remarks] || '',
    cabin_type: record[mapping.cabin_type] || '',
    rdp_yard: record[mapping.rdp_yard] || '',
    cable_origin__switch_: record[mapping.cable_origin__switch_] || '',
    system: sourceTable, // Use source table as system
    source_table: sourceTable
  };
  
  return normalized;
}

// COMPLETELY NEW CABIN CABLE SERVICE - ONLY FETCHES FROM PBX, TV, WIFI TABLES
export const cabinCableService = {
  // Get all cabin cables from ONLY the three specific tables
  async getAllCabinCables(): Promise<CabinCable[]> {
    console.log(' NEW CABIN SERVICE: Fetching from PBX, TV, WiFi tables ONLY');
    
    try {
      // Get total counts first to understand data size
      console.log('🔥 Getting total record counts for all tables...');
      const { count: pbxTotalCount } = await supabase
        .from('wgc_databasewgc_database_pbx')
        .select('*', { count: 'exact', head: true });
      const { count: pbxCabinCount } = await supabase
        .from('wgc_databasewgc_database_pbx')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      console.log('🔥 PBX Total records:', pbxTotalCount);
      console.log('🔥 PBX Cabin records (inside_cabin=yes):', pbxCabinCount);
      
      // Fetch ALL PBX data using pagination to bypass 1000-row limit
      console.log('🔥 Fetching ALL PBX cabin records using pagination...');
      let pbxData: any[] = [];
      let pbxError: any = null;
      let pbxOffset = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data: pbxBatch, error: pbxBatchError } = await supabase
          .from('wgc_databasewgc_database_pbx')
          .select('*')
          .eq('inside_cabin', 'yes')
          .range(pbxOffset, pbxOffset + batchSize - 1);
        
        if (pbxBatchError) {
          pbxError = pbxBatchError;
          break;
        }
        
        if (!pbxBatch || pbxBatch.length === 0) break;
        
        pbxData = [...pbxData, ...pbxBatch];
        console.log('🔥 PBX batch loaded:', pbxBatch.length, 'records, total so far:', pbxData.length);
        
        if (pbxBatch.length < batchSize) break; // Last batch
        pbxOffset += batchSize;
      }
      
      console.log('🔥 PBX FETCH RESULT: Got', pbxData?.length || 0, 'records');
      if (pbxData && pbxData.length > 0) {
        const pbxDKs = pbxData.map(r => r.dk).filter(dk => dk !== null && dk !== undefined);
        const pbxDKNumbers = pbxDKs.map(dk => parseInt(dk) || 0).filter(n => !isNaN(n));
        console.log('🔥 PBX DK VALUES: Min:', Math.min(...pbxDKNumbers), 'Max:', Math.max(...pbxDKNumbers));
        console.log('🔥 PBX SAMPLE DKs:', pbxDKs.slice(0, 10));
        console.log('🔥 PBX SAMPLE RECORDS:', pbxData.slice(0, 3).map(r => ({ cable_id: r.cable_id, dk: r.dk, inside_cabin: r.inside_cabin })));
      }
      
      if (pbxError) {
        console.error('PBX fetch error:', pbxError);
        throw pbxError;
      }
      
      // Get TV table counts
      const { count: tvTotalCount } = await supabase
        .from('wgc_databasewgc_database_tv')
        .select('*', { count: 'exact', head: true });
      const { count: tvCabinCount } = await supabase
        .from('wgc_databasewgc_database_tv')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      console.log('🔥 TV Total records:', tvTotalCount);
      console.log('🔥 TV Cabin records (inside_cabin=yes):', tvCabinCount);
      
      // Fetch ALL TV data using pagination to bypass 1000-row limit
      console.log('🔥 Fetching ALL TV cabin records using pagination...');
      let tvData: any[] = [];
      let tvError: any = null;
      let tvOffset = 0;
      
      while (true) {
        const { data: tvBatch, error: tvBatchError } = await supabase
          .from('wgc_databasewgc_database_tv')
          .select('*')
          .eq('inside_cabin', 'yes')
          .range(tvOffset, tvOffset + batchSize - 1);
        
        if (tvBatchError) {
          tvError = tvBatchError;
          break;
        }
        
        if (!tvBatch || tvBatch.length === 0) break;
        
        tvData = [...tvData, ...tvBatch];
        console.log('🔥 TV batch loaded:', tvBatch.length, 'records, total so far:', tvData.length);
        
        if (tvBatch.length < batchSize) break; // Last batch
        tvOffset += batchSize;
      }
      
      console.log('🔥 TV FETCH RESULT: Got', tvData?.length || 0, 'records');
      if (tvData && tvData.length > 0) {
        // 🔍 HEADER DEBUG: Show actual column names
        console.log('🔍 TV TABLE HEADERS:', Object.keys(tvData[0]));
        console.log('🔍 TV SAMPLE RECORD (full):', tvData[0]);
        
        const tvDKs = tvData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
        console.log('🔥 TV DK VALUES: Min:', Math.min(...tvDKs), 'Max:', Math.max(...tvDKs));
        console.log('🔥 TV SAMPLE DKs:', tvDKs.slice(0, 10));
        console.log('🔥 TV SAMPLE RECORDS:', tvData.slice(0, 3).map(r => ({ cable_id: r.cable_id, dk: r.dk, inside_cabin: r.inside_cabin })));
        
        // 🔍 SPECIFIC DEBUG: Look for DK=10 records that user showed in screenshot
        const dk10Records = tvData.filter(r => r.dk === '10' || r.dk === 10);
        console.log('🔍 TV DK=10 RECORDS FOUND:', dk10Records.length);
        if (dk10Records.length > 0) {
          console.log('🔍 TV DK=10 SAMPLE:', dk10Records.slice(0, 5).map(r => ({ 
            cable_id: r.cable_id, 
            dk: r.dk, 
            inside_cabin: r.inside_cabin,
            area: r.area 
          })));
        }
        
        // Check for specific cable IDs from screenshot
        const screenshotCables = tvData.filter(r => 
          r.cable_id === 'tv10208-1' || 
          r.cable_id === 'tv10206-1' || 
          r.cable_id === 'tv10660-1'
        );
        console.log('🔍 SCREENSHOT CABLE IDs FOUND:', screenshotCables.length);
        if (screenshotCables.length > 0) {
          console.log('🔍 SCREENSHOT CABLES:', screenshotCables.map(r => ({ 
            cable_id: r.cable_id, 
            dk: r.dk, 
            inside_cabin: r.inside_cabin 
          })));
        }
      }
      
      if (tvError) {
        console.error('TV fetch error:', tvError);
        throw tvError;
      }
      
      // Get WiFi table counts
      const { count: wifiTotalCount } = await supabase
        .from('wgc_databasewgc_database_wifi')
        .select('*', { count: 'exact', head: true });
      const { count: wifiCabinCount } = await supabase
        .from('wgc_databasewgc_database_wifi')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      console.log('🔥 WiFi Total records:', wifiTotalCount);
      console.log('🔥 WiFi Cabin records (inside_cabin=yes):', wifiCabinCount);
      
      // Fetch ALL WiFi data using pagination to bypass 1000-row limit
      console.log('🔥 Fetching ALL WiFi cabin records using pagination...');
      let wifiData: any[] = [];
      let wifiError: any = null;
      let wifiOffset = 0;
      
      while (true) {
        const { data: wifiBatch, error: wifiBatchError } = await supabase
          .from('wgc_databasewgc_database_wifi')
          .select('*')
          .eq('inside_cabin', 'yes')
          .range(wifiOffset, wifiOffset + batchSize - 1);
        
        if (wifiBatchError) {
          wifiError = wifiBatchError;
          break;
        }
        
        if (!wifiBatch || wifiBatch.length === 0) break;
        
        wifiData = [...wifiData, ...wifiBatch];
        console.log('🔥 WiFi batch loaded:', wifiBatch.length, 'records, total so far:', wifiData.length);
        
        if (wifiBatch.length < batchSize) break; // Last batch
        wifiOffset += batchSize;
      }
      
      console.log('🔥 WiFi FETCH RESULT: Got', wifiData?.length || 0, 'records');
      if (wifiData && wifiData.length > 0) {
        // 🔍 HEADER DEBUG: Show actual column names
        console.log('🔍 WiFi TABLE HEADERS:', Object.keys(wifiData[0]));
        console.log('🔍 WiFi SAMPLE RECORD (full):', wifiData[0]);
        
        const wifiDKs = wifiData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
        console.log('🔥 WiFi DK VALUES: Min:', Math.min(...wifiDKs), 'Max:', Math.max(...wifiDKs));
        console.log('🔥 WiFi SAMPLE DKs:', wifiDKs.slice(0, 10));
        console.log('🔥 WiFi SAMPLE RECORDS:', wifiData.slice(0, 3).map(r => ({ cable_id: r.cable_id, dk: r.dk, inside_cabin: r.inside_cabin })));
      }
      
      if (wifiError) {
        console.error('WiFi fetch error:', wifiError);
        throw wifiError;
      }
      
      // Normalize and combine all data using the header normalization function
      const allCables: CabinCable[] = [
        ...pbxData.map(record => normalizeRecord(record, 'pbx')),
        ...tvData.map(record => normalizeRecord(record, 'tv')),
        ...wifiData.map(record => normalizeRecord(record, 'wifi'))
      ];
      
      console.log('🔍 NORMALIZATION COMPLETE:');
      console.log('🔍 Sample normalized PBX record:', allCables.find(c => c.source_table === 'pbx'));
      console.log('🔍 Sample normalized TV record:', allCables.find(c => c.source_table === 'tv'));
      console.log('🔍 Sample normalized WiFi record:', allCables.find(c => c.source_table === 'wifi'));
      
      // Check DK values after normalization
      const allDKs = allCables.map(c => parseInt(c.dk) || 0).filter(n => !isNaN(n));
      console.log('🔍 NORMALIZED DK RANGE:', Math.min(...allDKs), 'to', Math.max(...allDKs));
      console.log('🔍 NORMALIZED DK >= 10 COUNT:', allCables.filter(c => parseInt(c.dk) >= 10).length);
      
      // Final DK value analysis on complete dataset
      const allDKsAfterPagination = allCables.map(c => parseInt(c.dk) || 0).filter(n => !isNaN(n));
      const dkRange = { min: Math.min(...allDKsAfterPagination), max: Math.max(...allDKsAfterPagination) };
      const highDKCount = allCables.filter(c => parseInt(c.dk) >= 10).length;
      
      console.log('🎉 FINAL DATASET ANALYSIS:');
      console.log('🎉 Complete DK range:', dkRange.min, 'to', dkRange.max);
      console.log('🎉 Records with DK >= 10:', highDKCount);
      console.log('🎉 Total records processed:', allCables.length);
      
      console.log('🔥🔥🔥 CABIN SERVICE RESULTS 🔥🔥🔥');
      console.log(`🔥 PBX records: ${pbxData.length}`);
      console.log(`🔥 TV records: ${tvData.length}`);
      console.log(`🔥 WiFi records: ${wifiData.length}`);
      console.log(`🔥 Total combined: ${allCables.length}`);
      console.log(`🔥 Source tables: ${[...new Set(allCables.map((item: CabinCable) => item.source_table))]}`);
      
      // Log sample cable IDs from each table
      const pbxCables = allCables.filter((c: CabinCable) => c.source_table === 'pbx' && c.cable_id).slice(0, 10).map((c: CabinCable) => c.cable_id);
      console.log(`🔥 PBX Cable IDs (first 10): ${pbxCables}`);
      console.log('🔥 First PBX record:', allCables.find((c: CabinCable) => c.source_table === 'pbx'));
      
      const tvCables = allCables.filter((c: CabinCable) => c.source_table === 'tv' && c.cable_id).slice(0, 10).map((c: CabinCable) => c.cable_id);
      console.log(`🔥 TV Cable IDs (first 10): ${tvCables}`);
      console.log('🔥 First TV record:', allCables.find((c: CabinCable) => c.source_table === 'tv'));
      
      const wifiCables = allCables.filter((c: CabinCable) => c.source_table === 'wifi' && c.cable_id).slice(0, 10).map((c: CabinCable) => c.cable_id);
      console.log(`🔥 WiFi Cable IDs (first 10): ${wifiCables}`);
      console.log('🔥 First WiFi record:', allCables.find((c: CabinCable) => c.source_table === 'wifi'));
      
      console.log('🔥🔥🔥 END RESULTS 🔥🔥🔥');
      
      // Now fetch online status from extracted table and merge it
      console.log('🔥 Fetching online status from extracted table...');
      try {
        const { data: extractedData, error: extractedError } = await supabase
          .from('wgc_databasewgc_database_extracted')
          .select('cable_id, online__controller_');
        
        if (extractedError) {
          console.error('🔥 Error fetching online status:', extractedError);
        } else if (extractedData) {
          // Debug: Check what data we have for C20136/pbx20136
          const c20136Record = extractedData.find((r: any) => r.cable_id === 'C20136');
          if (c20136Record) {
            console.log('🔍 DEBUG: Found C20136 in extracted table:', c20136Record);
          }
          
          // Create a map for fast lookup with ID format conversion
          const onlineStatusMap = new Map();
          extractedData.forEach((record: any) => {
            if (record.cable_id && record.online__controller_ !== undefined) {
              // Store with original format
              onlineStatusMap.set(record.cable_id, record.online__controller_);
              
              // Also store with potential cabin cable formats
              // C20128 -> pbx20128, tv20128, wifi20128
              if (record.cable_id.startsWith('C')) {
                const numericPart = record.cable_id.substring(1);
                onlineStatusMap.set(`pbx${numericPart}`, record.online__controller_);
                onlineStatusMap.set(`tv${numericPart}`, record.online__controller_);
                onlineStatusMap.set(`tv${numericPart}-1`, record.online__controller_);
                onlineStatusMap.set(`tv${numericPart}-2`, record.online__controller_);
                onlineStatusMap.set(`wifi${numericPart}`, record.online__controller_);
                
                // Debug specific cable
                if (numericPart === '20136') {
                  console.log(`🔍 DEBUG: Mapping C${numericPart} (${record.online__controller_}) to pbx${numericPart}`);
                }
              }
            }
          });
          
          // Merge online status into cabin cables
          allCables.forEach(cable => {
            if (cable.cable_id && onlineStatusMap.has(cable.cable_id)) {
              cable.online__controller_ = onlineStatusMap.get(cable.cable_id);
            }
          });
        }
      } catch (onlineError) {
        console.error('🔥 Error merging online status:', onlineError);
      }
      
      return allCables;
    } catch (error) {
      console.error('🔥 Error in new cabin service:', error);
      throw error;
    }
  },

  // Fetch data from a specific table with pagination
  async fetchTableData(tableName: string, sourceType: 'pbx' | 'tv' | 'wifi'): Promise<CabinCable[]> {
    console.log(`Fetching data from ${tableName}...`);
    
    const allCables: CabinCable[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000; // Supabase's default limit
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      console.log(`Fetching ${tableName} page ${page + 1}: records ${from + 1} to ${to + 1}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true })
        .range(from, to);
      
      if (error) {
        console.error(`Error fetching ${tableName} page ${page + 1}:`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Add source_table field to each record
        const processedData = data.map((item: any) => ({
          ...item,
          source_table: sourceType
        }));
        
        allCables.push(...processedData);
        console.log(`${tableName} page ${page + 1}: Got ${data.length} records`);
        
        // Check if we got a full page (means there might be more)
        if (data.length < pageSize) {
          hasMore = false;
          console.log(`${tableName} page ${page + 1} has ${data.length} records (less than ${pageSize}), stopping pagination`);
        }
      } else {
        hasMore = false;
        console.log(`${tableName} page ${page + 1}: No more data`);
      }
      
      page++;
      
      // Safety check to prevent infinite loops
      if (page > 20) {
        console.warn(`Reached maximum page limit (20) for ${tableName}, stopping pagination`);
        break;
      }
    }
    
    return allCables;
  },

  // Get cabin cable by ID (search across all three tables)
  async getCabinCableById(id: string): Promise<CabinCable | null> {
    // Try searching in each table
    const tables = [
      { name: 'wgc_databasewgc_database_pbx', source: 'pbx' as const },
      { name: 'wgc_databasewgc_database_tv', source: 'tv' as const },
      { name: 'wgc_databasewgc_database_wifi', source: 'wifi' as const }
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        console.error(`Error fetching from ${table.name}:`, error);
        continue;
      }
      
      if (data) {
        return {
          ...data,
          source_table: table.source
        };
      }
    }
    
    return null;
  },

  // Get total count from ONLY the three specific tables
  async getCabinCableCount(): Promise<number> {
    console.log('🔥 NEW CABIN SERVICE: Getting count from PBX, TV, WiFi tables ONLY');
    
    try {
      // Get PBX count (only inside_cabin = 'yes')
      const { count: pbxCount, error: pbxError } = await supabase
        .from('wgc_databasewgc_database_pbx')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      
      if (pbxError) {
        console.error('PBX count error:', pbxError);
        throw pbxError;
      }
      
      // Get TV count (only inside_cabin = 'yes')
      const { count: tvCount, error: tvError } = await supabase
        .from('wgc_databasewgc_database_tv')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      
      if (tvError) {
        console.error('TV count error:', tvError);
        throw tvError;
      }
      
      // Get WiFi count (only inside_cabin = 'yes')
      const { count: wifiCount, error: wifiError } = await supabase
        .from('wgc_databasewgc_database_wifi')
        .select('*', { count: 'exact', head: true })
        .eq('inside_cabin', 'yes');
      
      if (wifiError) {
        console.error('WiFi count error:', wifiError);
        throw wifiError;
      }
      
      const totalCount = (pbxCount || 0) + (tvCount || 0) + (wifiCount || 0);
      console.log(`🔥 NEW CABIN SERVICE COUNT: Total ${totalCount} (PBX: ${pbxCount}, TV: ${tvCount}, WiFi: ${wifiCount})`);
      
      return totalCount;
    } catch (error) {
      console.error('🔥 Error getting cabin cable count:', error);
      throw error;
    }
  },
  
  // Get count from a specific table
  async getTableCount(tableName: string): Promise<number> {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error getting count for ${tableName}:`, error);
      throw error;
    }
    
    return count || 0;
  },
  
  // Search cabin cables across all three tables
  async searchCabinCables(searchTerm: string): Promise<CabinCable[]> {
    try {
      // Search in all tables in parallel
      const [pbxResults, tvResults, wifiResults] = await Promise.all([
        this.searchTable('wgc_databasewgc_database_pbx', searchTerm, 'pbx'),
        this.searchTable('wgc_databasewgc_database_tv', searchTerm, 'tv'),
        this.searchTable('wgc_databasewgc_database_wifi', searchTerm, 'wifi')
      ]);
      
      // Combine all search results
      const allResults = [...pbxResults, ...tvResults, ...wifiResults];
      console.log(`Total search results: ${allResults.length} (PBX: ${pbxResults.length}, TV: ${tvResults.length}, WiFi: ${wifiResults.length})`);
      
      return allResults;
    } catch (error) {
      console.error('Error searching cabin cables:', error);
      throw error;
    }
  },
  
  // Search within a specific table
  async searchTable(tableName: string, searchTerm: string, sourceType: 'pbx' | 'tv' | 'wifi'): Promise<CabinCable[]> {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .or(`cable_id.ilike.%${searchTerm}%,area.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,system.ilike.%${searchTerm}%,user.ilike.%${searchTerm}%`)
      .order('id', { ascending: true });
    
    if (error) {
      console.error(`Error searching ${tableName}:`, error);
      throw error;
    }
    
    // Add source_table to each record
    return (data || []).map((item: any) => ({
      ...item,
      source_table: sourceType
    }));
  },
  
  // Get cabin cables by system (filter across all tables)
  async getCabinCablesBySystem(system: string): Promise<CabinCable[]> {
    if (system === 'all') {
      return this.getAllCabinCables();
    }
    
    try {
      // Filter in all tables in parallel
      const [pbxResults, tvResults, wifiResults] = await Promise.all([
        this.filterTableBySystem('wgc_databasewgc_database_pbx', system, 'pbx'),
        this.filterTableBySystem('wgc_databasewgc_database_tv', system, 'tv'),
        this.filterTableBySystem('wgc_databasewgc_database_wifi', system, 'wifi')
      ]);
      
      // Combine all filtered results
      const allResults = [...pbxResults, ...tvResults, ...wifiResults];
      console.log(`Total cables for system '${system}': ${allResults.length} (PBX: ${pbxResults.length}, TV: ${tvResults.length}, WiFi: ${wifiResults.length})`);
      
      return allResults;
    } catch (error) {
      console.error(`Error getting cabin cables for system '${system}':`, error);
      throw error;
    }
  },
  
  // Filter a specific table by system
  async filterTableBySystem(tableName: string, system: string, sourceType: 'pbx' | 'tv' | 'wifi'): Promise<CabinCable[]> {
    const allCables: CabinCable[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('system', system)
        .order('id', { ascending: true })
        .range(from, to);
      
      if (error) {
        console.error(`Error filtering ${tableName} by system ${system} (page ${page + 1}):`, error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Add source_table to each record
        const processedData = data.map((item: any) => ({
          ...item,
          source_table: sourceType
        }));
        
        allCables.push(...processedData);
        
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
      
      page++;
      
      if (page > 20) {
        console.warn(`Reached maximum page limit for ${tableName} filtering by system ${system}`);
        break;
      }
    }
    
    return allCables;
  },
  
  // Get count by system across all tables
  async getCountBySystem(system: string): Promise<number> {
    try {
      // Get counts from all tables in parallel
      const [pbxCount, tvCount, wifiCount] = await Promise.all([
        this.getTableCountBySystem('wgc_databasewgc_database_pbx', system),
        this.getTableCountBySystem('wgc_databasewgc_database_tv', system),
        this.getTableCountBySystem('wgc_databasewgc_database_wifi', system)
      ]);
      
      const totalCount = pbxCount + tvCount + wifiCount;
      console.log(`Total count for system '${system}': ${totalCount} (PBX: ${pbxCount}, TV: ${tvCount}, WiFi: ${wifiCount})`);
      
      return totalCount;
    } catch (error) {
      console.error(`Error getting count for system '${system}':`, error);
      throw error;
    }
  },
  
  // Get count by system for a specific table
  async getTableCountBySystem(tableName: string, system: string): Promise<number> {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('system', system);
    
    if (error) {
      console.error(`Error getting count for ${tableName} with system ${system}:`, error);
      throw error;
    }
    
    return count || 0;
  },

  // Get offline WiFi cables
  async getOfflineWifiCables(): Promise<Cable[]> {
    try {
      console.log('Fetching offline WiFi cables...');
      
      // Use pagination to get all records
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('wgc_databasewgc_database_wifi')
          .select('*')
          .or('online__controller_.eq.OFFLINE,online__controller_.eq.offline,online__at_once_.eq.OFFLINE,online__at_once_.eq.offline')
          .eq('inside_cabin', 'no')
          .range(from, to);
        
        if (error) {
          console.error(`Error fetching offline WiFi cables page ${page + 1}:`, error);
          break;
        }
        
        if (data && data.length > 0) {
          allData.push(...data);
          
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        if (page > 10) { // Safety limit
          break;
        }
      }
      
      console.log(`Found ${allData.length} offline WiFi cables`);
      
      // Convert to Cable interface
      return allData.map(item => ({
        id: item.id || 0,
        cable_id: item.cable_id || '',
        area: item.area || '',
        dk: item.dk || '',
        fz: item.fz || '',
        frame: item.frame || '',
        side: item.side || '',
        location: item.location || '',
        system: item.system || 'wifi',
        installed: item.installed || '',
        mac_address: item.mac_address || '',
        user: item.user || '',
        beaty_remarks: item.beaty_remarks || '',
        rdp_yard: item.rdp_yard || '',
        switch: item.switch || '',
        blade_port: item.blade_port || '',
        device_name___extension: item.device_name___extension || ''
      }));
    } catch (error) {
      console.error('Error in getOfflineWifiCables:', error);
      return [];
    }
  },

  // Get offline PBX cables
  async getOfflinePbxCables(): Promise<Cable[]> {
    try {
      console.log('Fetching offline PBX cables...');
      
      // Use pagination to get all records
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('wgc_databasewgc_database_pbx')
          .select('*')
          .or('online__controller_.eq.OFFLINE,online__controller_.eq.offline,online__at_once_.eq.OFFLINE,online__at_once_.eq.offline')
          .eq('inside_cabin', 'no')
          .range(from, to);
        
        if (error) {
          console.error(`Error fetching offline PBX cables page ${page + 1}:`, error);
          break;
        }
        
        if (data && data.length > 0) {
          allData.push(...data);
          
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        if (page > 10) { // Safety limit
          break;
        }
      }
      
      console.log(`Found ${allData.length} offline PBX cables`);
      
      // Convert to Cable interface
      return allData.map(item => ({
        id: item.id || 0,
        cable_id: item.cable_id || '',
        area: item.area || '',
        dk: item.dk || '',
        fz: item.fz || '',
        frame: item.frame || '',
        side: item.side || '',
        location: item.location || '',
        system: item.system || 'pbx',
        installed: item.installed || '',
        mac_address: item.mac_address || '',
        user: item.user || '',
        beaty_remarks: item.beaty_remarks || '',
        rdp_yard: item.rdp_yard || '',
        switch: item.switch || '',
        blade_port: item.blade_port || '',
        device_name___extension: item.device_name___extension || ''
      }));
    } catch (error) {
      console.error('Error in getOfflinePbxCables:', error);
      return [];
    }
  },

  // Get offline TV cables
  async getOfflineTvCables(): Promise<Cable[]> {
    try {
      console.log('Fetching offline TV cables...');
      
      // Use pagination to get all records
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data, error } = await supabase
          .from('wgc_databasewgc_database_tv')
          .select('*')
          .or('online__controller_.eq.OFFLINE,online__controller_.eq.offline,online__at_once_.eq.OFFLINE,online__at_once_.eq.offline')
          .eq('inside_cabin', 'no')
          .range(from, to);
        
        if (error) {
          console.error(`Error fetching offline TV cables page ${page + 1}:`, error);
          break;
        }
        
        if (data && data.length > 0) {
          allData.push(...data);
          
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        if (page > 10) { // Safety limit
          break;
        }
      }
      
      console.log(`Found ${allData.length} offline TV cables`);
      
      // Convert to Cable interface
      return allData.map(item => ({
        id: item.id || 0,
        cable_id: item.cable_id || '',
        area: item.area || '',
        dk: item.dk || '',
        fz: item.fz || '',
        frame: item.frame || '',
        side: item.side || '',
        location: item.location || '',
        system: item.system || 'tv',
        installed: item.installed || '',
        mac_address: item.mac_address || '',
        user: item.user || '',
        beaty_remarks: item.beaty_remarks || '',
        rdp_yard: item.rdp_yard || '',
        switch: item.switch || '',
        blade_port: item.blade_port || '',
        device_name___extension: item.device_name___extension || ''
      }));
    } catch (error) {
      console.error('Error in getOfflineTvCables:', error);
      return [];
    }
  }
}; 