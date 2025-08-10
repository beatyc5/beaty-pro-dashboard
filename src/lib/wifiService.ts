import { getBrowserClient, createServerClient } from './supabaseClient';

// Get Supabase client instance
// Prefer the singleton browser client in the browser to avoid multiple GoTrueClient instances
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    const client = getBrowserClient();
    if (!client) {
      throw new Error('No Supabase browser client available');
    }
    return client as any;
  }
  return createServerClient() as any;
};

// Ensure we have an active session before issuing any queries from the browser.
// Returns the client if authenticated; otherwise returns null (callers should bail early).
const getAuthedClient = async () => {
  try {
    const client = getSupabaseClient();
    if (!client || typeof window === 'undefined') return null;
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      console.warn('[wifiService] No active session; skipping REST queries');
      return null;
    }
    return client;
  } catch (e) {
    console.warn('[wifiService] Failed to confirm session; skipping REST queries', e);
    return null;
  }
};

// WiFi service for Ship Drawings page
export const wifiService = {
  // Get cabin offline data with DK and device type
  async getCabinOfflineData(): Promise<{dk: string, device_name: string, device_type: string}[]> {
    console.log('Fetching cabin offline data...');
    
    try {
      const authed = await getAuthedClient();
      if (!authed) return [];
      // Fetch data from all three tables: WiFi, PBX, and TV
      const wifiData = await this.fetchOfflineDataFromTable('wgc_databasewgc_database_wifi', true);
      const pbxData = await this.fetchOfflineDataFromTable('wgc_databasewgc_database_pbx', true);
      const tvData = await this.fetchOfflineDataFromTable('wgc_databasewgc_database_tv', true);
      
      console.log(`Found ${wifiData.length} WiFi, ${pbxData.length} PBX, and ${tvData.length} TV offline cabin devices`);
      
      // Combine all data and normalize
      const allData = [
        ...wifiData.map(item => ({ ...item, device_type: 'wifi' })),
        ...pbxData.map(item => ({ ...item, device_type: 'pbx' })),
        ...tvData.map(item => ({ ...item, device_type: 'tv' }))
      ];
      
      return allData.map((item, index) => ({
        dk: item.dk || item.DK || `DK-${index}`,
        device_name: item.device_name___extension || item.device_name || item.device || item.name || `Device-${index}`,
        device_type: item.device_type
      }));
    } catch (error) {
      console.error('Error in getCabinOfflineData:', error);
      return [];
    }
  },
  
  // Helper function to fetch offline data from a specific table
  async fetchOfflineDataFromTable(tableName: string, insideCabin: boolean): Promise<any[]> {
    try {
      const authed = await getAuthedClient();
      if (!authed) return [];
      // Use pagination to get all records
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await getSupabaseClient()
          .from(tableName)
          .select('*')
          .range(from, to);
        
        if (pageError) {
          console.error(`Error fetching ${tableName} page ${page + 1}:`, pageError);
          break;
        }
        
        if (pageData && pageData.length > 0) {
          allData.push(...pageData);
          console.log(`${tableName} Page ${page + 1}: Got ${pageData.length} records`);
          
          if (pageData.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        if (page > 10) { // Safety limit
          console.warn(`Reached page limit for ${tableName}, stopping`);
          break;
        }
      }
      
      // Filter for offline devices
      let filteredData = allData.filter(item => 
        item.online__controller_ === 'OFFLINE' || 
        item.online__controller_ === 'offline' ||
        item.online__at_once_ === 'OFFLINE' || 
        item.online__at_once_ === 'offline'
      );
      
      // Filter for cabin or public areas based on parameter
      if (insideCabin) {
        filteredData = filteredData.filter(item => 
          item.inside_cabin === 'yes' || 
          item.inside_cabin === 'Yes' || 
          item.inside_cabin === 'YES'
        );
      } else {
        filteredData = filteredData.filter(item => 
          item.inside_cabin === 'no' || 
          item.inside_cabin === 'No' || 
          item.inside_cabin === 'NO'
        );
      }
      
      return filteredData;
    } catch (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return [];
    }
  },
  
  // Get public WiFi offline data with DK and AP name
  async getPublicWifiOfflineData(): Promise<{dk: string, ap_name: string, device_name: string, user: string}[]> {
    console.log('Analyzing WiFi table for public offline APs...');
    
    try {
      const authed = await getAuthedClient();
      if (!authed) return [];
      // First, verify that the table exists and get sample fields
      console.log('Fetching data from wgc_databasewgc_database_wifi using special method...');
      const { data: sampleData, error: sampleError } = await getSupabaseClient()
        .from('wgc_databasewgc_database_wifi')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('Error getting sample WiFi data:', sampleError);
        throw new Error(`Sample data error: ${JSON.stringify(sampleError)}`);
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('Available WiFi table fields:', Object.keys(sampleData[0]));
        console.log('Sample WiFi record:', sampleData[0]);
      } else {
        console.log('No sample data found in WiFi table');
      }
      
      // Now fetch ALL WiFi data to find all offline public devices
      console.log('Fetching ALL WiFi data...');
      
      // Use pagination to get all records
      let allWifiData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: pageData, error: pageError } = await getSupabaseClient()
          .from('wgc_databasewgc_database_wifi')
          .select('*')
          .range(from, to);
        
        if (pageError) {
          console.error(`Error fetching WiFi page ${page + 1}:`, pageError);
          throw new Error(`Page fetch error: ${JSON.stringify(pageError)}`);
        }
        
        if (pageData && pageData.length > 0) {
          allWifiData.push(...pageData);
          console.log(`Page ${page + 1}: Got ${pageData.length} records`);
          
          if (pageData.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        page++;
        if (page > 10) { // Safety limit
          console.warn('Reached page limit, stopping');
          break;
        }
      }
      
      const data = allWifiData;
      const error = null;
      
      console.log(`Found ${data?.length || 0} total WiFi records`);
      
      if (data && data.length > 0) {
        console.log('Sample WiFi records:', data.slice(0, 2));
        
        // Check what fields exist for filtering
        const firstRecord = data[0];
        const hasOnlineController = 'online__controller_' in firstRecord;
        const hasInsideCabin = 'inside_cabin' in firstRecord;
        const hasOnlineAtOnce = 'online__at_once_' in firstRecord;
        
        console.log('Field availability:', {
          online__controller_: hasOnlineController,
          inside_cabin: hasInsideCabin,
          online__at_once_: hasOnlineAtOnce
        });
        
        // Filter the data based on available fields
        let filteredData = data;
        
        // Filter for offline devices
        if (hasOnlineController) {
          filteredData = filteredData.filter(item => 
            item.online__controller_ === 'OFFLINE' || 
            item.online__controller_ === 'offline'
          );
        } else if (hasOnlineAtOnce) {
          filteredData = filteredData.filter(item => 
            item.online__at_once_ === 'OFFLINE' || 
            item.online__at_once_ === 'offline'
          );
        }
        
        // Filter for public areas (not cabins)
        if (hasInsideCabin) {
          filteredData = filteredData.filter(item => 
            item.inside_cabin === 'no' || 
            item.inside_cabin === 'No' || 
            item.inside_cabin === 'NO'
          );
        }
        
        console.log(`Filtered to ${filteredData.length} offline public WiFi devices out of ${data.length} total records`);
        
        // Map the data to our expected format
        return filteredData.map((item, index) => ({
          dk: item.dk || item.DK || `DK-${index}`,
          ap_name: item.device_name___extension || item.device_name || item.device || item.name || `AP-${index}`,
          device_name: item.device_name___extension || item.device_name || item.device || item.name || `Device-${index}`,
          user: item.user || item.USER || 'N/A'
        }));
      }
      
      return [];
      
    } catch (error) {
      console.error('Error in getPublicWifiOfflineData:', error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  }
};
