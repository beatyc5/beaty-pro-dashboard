import { getBrowserClient, createServerClient } from './supabaseClient';

// Get Supabase client instance
// Use the singleton browser client on the client to avoid multiple GoTrueClient instances
// Fall back to a non-persistent server client only when running on the server
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

// Ensure there is an active session before any REST query.
// Returns the client if a session exists; otherwise returns null.
const getClientIfSession = async () => {
  const client = getSupabaseClient();
  try {
    const { data } = await (client as any).auth.getSession();
    if (data?.session?.access_token) return client;
  } catch (e) {
    // fall through
  }
  console.warn('[DashboardService] No active session; skipping REST queries');
  return null;
};

// Interface for user type counts
export interface CountsByUserType {
  crew: number;
  pax: number;
  total: number;
  cabinCrew: number;
  cabinPax: number;
  publicCrew: number;
  publicPax: number;
}

// Interface for online/offline counts
export interface ServiceStatus {
  online: CountsByUserType;
  offline: CountsByUserType;
  total: CountsByUserType;
}

// Interface for dashboard data
export interface DashboardData {
  cabinSwitch: ServiceStatus;
  wifi: ServiceStatus;
  pbx: ServiceStatus;
  tv: ServiceStatus;
  totalOnline: number;
  totalOffline: number;
  totalDevices: number;
  lastUpdated?: string;
}

// Dashboard Service class for fetching and processing data
export class DashboardService {
  // Table names for the different services
  private readonly tableCabinSwitch = 'wgc_databasewgc_database_cabin_switch';
  private readonly tableWifi = 'wgc_databasewgc_database_wifi';
  private readonly tablePbx = 'wgc_databasewgc_database_pbx';
  private readonly tableTv = 'wgc_databasewgc_database_tv';
  private readonly tableExtracted = 'wgc_databasewgc_database_extracted';
  private readonly tableFieldCables = 'wgc_databasewgc_database_field_cables';

  // Helper method to check if a field exists in a table
  private async fieldExistsInTable(tableName: string, fieldName: string): Promise<boolean> {
    try {
      const { data, error } = await getSupabaseClient()
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error || !data || data.length === 0) {
        console.log(`No data found in ${tableName} to check fields`);
        return false;
      }
      
      const fieldExists = Object.keys(data[0]).includes(fieldName);
      console.log(`Field '${fieldName}' ${fieldExists ? 'exists' : 'does not exist'} in ${tableName}`);
      return fieldExists;
    } catch (error) {
      console.error(`Error checking field existence in ${tableName}:`, error);
      return false;
    }
  }

  // Get counts for a specific service
  async getServiceCounts(tableName: string): Promise<ServiceStatus> {
    // Never run REST queries while on auth routes (signin/signup/reset), regardless of session state
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.startsWith('/auth')) {
        console.log('[DashboardService] Skipping queries on auth route:', path);
        return {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        };
      }
    }
    // Hard gate: do not perform any REST queries without a valid session
    const authed = await getClientIfSession();
    if (!authed) {
      return {
        online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
      };
    }
    // Use special method for WiFi table to handle its specific field structure
    if (tableName === this.tableWifi) {
      return this.getWifiCounts(tableName);
    }
    try {
      console.log(`Fetching data from ${tableName}...`);
      
      // Get total count first
      const { count: totalCount, error: countError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`Error counting records in ${tableName}:`, countError);
        throw countError;
      }
      
      const totalRecords = totalCount || 0;
      console.log(`Total count for ${tableName}: ${totalRecords}`);
      
      // Default online status field for non-WiFi tables
      const onlineField: string = 'online__controller_';

      // Get counts for online crew
      const { count: onlineCrewCount, error: onlineCrewError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(onlineField as any, 'ONLINE')
        .ilike('user', '%crew%');
      
      if (onlineCrewError) {
        console.error(`Error counting online crew in ${tableName}:`, onlineCrewError);
        throw onlineCrewError;
      }
      
      // Get counts for online pax
      const { count: onlinePaxCount, error: onlinePaxError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(onlineField as any, 'ONLINE')
        .ilike('user', '%pax%');
      
      if (onlinePaxError) {
        console.error(`Error counting online pax in ${tableName}:`, onlinePaxError);
        throw onlinePaxError;
      }
      
      // Get counts for total crew (online + offline)
      const { count: totalCrewCount, error: totalCrewError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .ilike('user', '%crew%');
      
      if (totalCrewError) {
        console.error(`Error counting total crew in ${tableName}:`, totalCrewError);
        throw totalCrewError;
      }
      
      // Get counts for total pax (online + offline)
      const { count: totalPaxCount, error: totalPaxError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .ilike('user', '%pax%');
      
      if (totalPaxError) {
        console.error(`Error counting total pax in ${tableName}:`, totalPaxError);
        throw totalPaxError;
      }
      
      // Check if inside_cabin field exists in this table
      const hasInsideCabinField = await this.fieldExistsInTable(tableName, 'inside_cabin');
      
      let cabinCrew = 0;
      let cabinPax = 0;
      let publicCrew = 0;
      let publicPax = 0;
      
      // Only query cabin/public splits if the inside_cabin field exists
      if (hasInsideCabinField) {
        try {
          // Get cabin crew counts
          const { count: cabinCrewCount, error: cabinCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%crew%');
          
          if (!cabinCrewError) {
            cabinCrew = cabinCrewCount || 0;
          } else {
            console.log(`Error counting cabin crew in ${tableName}, skipping: ${cabinCrewError.message}`);
          }
          
          // Get cabin pax counts
          const { count: cabinPaxCount, error: cabinPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%pax%');
          
          if (!cabinPaxError) {
            cabinPax = cabinPaxCount || 0;
          } else {
            console.log(`Error counting cabin pax in ${tableName}, skipping: ${cabinPaxError.message}`);
          }
          
          // Get public crew counts
          const { count: publicCrewCount, error: publicCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%crew%');
          
          if (!publicCrewError) {
            publicCrew = publicCrewCount || 0;
          } else {
            console.log(`Error counting public crew in ${tableName}, skipping: ${publicCrewError.message}`);
          }
          
          // Get public pax counts
          const { count: publicPaxCount, error: publicPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%pax%');
          
          if (!publicPaxError) {
            publicPax = publicPaxCount || 0;
          } else {
            console.log(`Error counting public pax in ${tableName}, skipping: ${publicPaxError.message}`);
          }
        } catch (e) {
          console.error(`Error in cabin/public split queries for ${tableName}:`, e);
          // Continue with zeros for cabin/public counts
        }
      } else {
        console.log(`No 'inside_cabin' field found in ${tableName}, skipping cabin/public split queries`);
      }
      
      // Calculate all counts
      const onlineCrew = onlineCrewCount || 0;
      const onlinePax = onlinePaxCount || 0;
      const totalCrew = totalCrewCount || 0;
      const totalPax = totalPaxCount || 0;
      
      // Calculate offline counts by subtracting online from total
      const offlineCrew = Math.max(0, totalCrew - onlineCrew);
      const offlinePax = Math.max(0, totalPax - onlinePax);
      
      const totalOnline = onlineCrew + onlinePax;
      const totalOffline = offlineCrew + offlinePax;
      
      // Calculate offline counts for cabin/public breakdown
      let offlineCabinCrew = 0;
      let offlineCabinPax = 0;
      let offlinePublicCrew = 0;
      let offlinePublicPax = 0;
      
      // Only calculate offline cabin/public splits if the inside_cabin field exists
      if (hasInsideCabinField) {
        try {
          // Get offline cabin crew counts
          const { count: offlineCabinCrewCount, error: offlineCabinCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%crew%')
            .neq('online__controller_', 'ONLINE');
          
          if (!offlineCabinCrewError) {
            offlineCabinCrew = offlineCabinCrewCount || 0;
          }
          
          // Get offline cabin pax counts
          const { count: offlineCabinPaxCount, error: offlineCabinPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%pax%')
            .neq('online__controller_', 'ONLINE');
          
          if (!offlineCabinPaxError) {
            offlineCabinPax = offlineCabinPaxCount || 0;
          }
          
          // Get offline public crew counts
          const { count: offlinePublicCrewCount, error: offlinePublicCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%crew%')
            .neq('online__controller_', 'ONLINE');
          
          if (!offlinePublicCrewError) {
            offlinePublicCrew = offlinePublicCrewCount || 0;
          }
          
          // Get offline public pax counts
          const { count: offlinePublicPaxCount, error: offlinePublicPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%pax%')
            .neq('online__controller_', 'ONLINE');
          
          if (!offlinePublicPaxError) {
            offlinePublicPax = offlinePublicPaxCount || 0;
          }
        } catch (e) {
          console.error(`Error in offline cabin/public split queries for ${tableName}:`, e);
          // Continue with zeros for offline cabin/public counts
        }
      }
      
      // Assemble the result object
      const result: ServiceStatus = {
        online: {
          crew: onlineCrew,
          pax: onlinePax,
          total: totalOnline,
          cabinCrew,
          cabinPax,
          publicCrew,
          publicPax
        },
        offline: {
          crew: offlineCrew,
          pax: offlinePax,
          total: totalOffline,
          cabinCrew: offlineCabinCrew,
          cabinPax: offlineCabinPax,
          publicCrew: offlinePublicCrew,
          publicPax: offlinePublicPax
        },
        total: {
          crew: totalCrew,
          pax: totalPax,
          total: totalRecords,
          cabinCrew,
          cabinPax,
          publicCrew,
          publicPax
        }
      };
      
      console.log(`${tableName} counts:`, result);
      return result;
    } catch (error) {
      console.error(`Error processing ${tableName} data:`, error);
      // Return zero counts in case of error to avoid breaking the dashboard
      return {
        online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
      };
    }
  }

  // Special method for handling WiFi table counts
  async getWifiCounts(tableName: string): Promise<ServiceStatus> {
    // Guard auth routes just like other services
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.startsWith('/auth')) {
        console.log('[DashboardService] Skipping WiFi queries on auth route:', path);
        return {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        };
      }
    }
    // Hard gate: do not perform any REST queries without a valid session
    const authed = await getClientIfSession();
    if (!authed) {
      return {
        online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
      };
    }
    try {
      // default online field; will be refined after sampling
      let onlineField: string = 'online__controller_';
      console.log(`Fetching WiFi data from ${tableName} using special method...`);
      
      // Get a single record to check field structure
      const { data: sampleData, error: sampleError } = await getSupabaseClient()
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error(`Error getting sample data from ${tableName}:`, sampleError);
        throw sampleError;
      }
      
      if (!sampleData || sampleData.length === 0) {
        console.error(`No data found in ${tableName}`);
        throw new Error(`No data found in ${tableName}`);
      }
      
      // Log available fields for debugging
      console.log(`Available fields in ${tableName}:`, Object.keys(sampleData[0]));
      
      // Determine which field indicates online/offline for WiFi table
      const onlineFieldCandidates = ['online__controller_', 'online__at_once_', 'online_status', 'online'];
      onlineField = onlineFieldCandidates.find((f) => Object.prototype.hasOwnProperty.call(sampleData[0], f)) || onlineField;
      console.log(`Using online status field '${onlineField}' for ${tableName}`);
      
      // Check if inside_cabin field exists in this table
      const hasInsideCabinField = Object.keys(sampleData[0]).includes('inside_cabin');
      console.log(`Field 'inside_cabin' ${hasInsideCabinField ? 'exists' : 'does not exist'} in ${tableName}`);
      
      // Get total count first
      const { count: totalCount, error: countError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`Error counting records in ${tableName}:`, countError);
        throw countError;
      }
      
      const totalRecords = totalCount || 0;
      console.log(`Total count for ${tableName}: ${totalRecords}`);
      
      // Get counts for online crew
      const { count: onlineCrewCount, error: onlineCrewError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('online__controller_', 'ONLINE')
        .ilike('user', '%crew%');
      
      if (onlineCrewError) {
        console.error(`Error counting online crew in ${tableName}:`, onlineCrewError);
        throw onlineCrewError;
      }
      
      // Get counts for online pax
      const { count: onlinePaxCount, error: onlinePaxError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('online__controller_', 'ONLINE')
        .ilike('user', '%pax%');
      
      if (onlinePaxError) {
        console.error(`Error counting online pax in ${tableName}:`, onlinePaxError);
        throw onlinePaxError;
      }
      
      // Get counts for explicit OFFLINE crew
      const { count: explicitOfflineCrewCount, error: offlineCrewError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(onlineField as any, 'OFFLINE')
        .ilike('user', '%crew%');
      
      if (offlineCrewError) {
        console.error(`Error counting offline crew in ${tableName}:`, offlineCrewError);
        throw offlineCrewError;
      }
      
      // Get counts for explicit OFFLINE pax
      const { count: explicitOfflinePaxCount, error: offlinePaxError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq(onlineField as any, 'OFFLINE')
        .ilike('user', '%pax%');
      
      if (offlinePaxError) {
        console.error(`Error counting offline pax in ${tableName}:`, offlinePaxError);
        throw offlinePaxError;
      }
      
      // Get counts for total crew (online + offline)
      const { count: totalCrewCount, error: totalCrewError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .ilike('user', '%crew%');
      
      if (totalCrewError) {
        console.error(`Error counting total crew in ${tableName}:`, totalCrewError);
        throw totalCrewError;
      }
      
      // Get counts for total pax (online + offline)
      const { count: totalPaxCount, error: totalPaxError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .ilike('user', '%pax%');
      
      if (totalPaxError) {
        console.error(`Error counting total pax in ${tableName}:`, totalPaxError);
        throw totalPaxError;
      }
      
      let cabinCrew = 0;
      let cabinPax = 0;
      let publicCrew = 0;
      let publicPax = 0;
      
      // Only query cabin/public splits if the inside_cabin field exists
      if (hasInsideCabinField) {
        try {
          // Get cabin crew counts
          const { count: cabinCrewCount, error: cabinCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%crew%');
          
          if (!cabinCrewError) {
            cabinCrew = cabinCrewCount || 0;
          } else {
            console.log(`Error counting cabin crew in ${tableName}, skipping: ${cabinCrewError.message}`);
          }
          
          // Get cabin pax counts
          const { count: cabinPaxCount, error: cabinPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%pax%');
          
          if (!cabinPaxError) {
            cabinPax = cabinPaxCount || 0;
          } else {
            console.log(`Error counting cabin pax in ${tableName}, skipping: ${cabinPaxError.message}`);
          }
          
          // Get public crew counts
          const { count: publicCrewCount, error: publicCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%crew%');
          
          if (!publicCrewError) {
            publicCrew = publicCrewCount || 0;
          } else {
            console.log(`Error counting public crew in ${tableName}, skipping: ${publicCrewError.message}`);
          }
          
          // Get public pax counts
          const { count: publicPaxCount, error: publicPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%pax%');
          
          if (!publicPaxError) {
            publicPax = publicPaxCount || 0;
          } else {
            console.log(`Error counting public pax in ${tableName}, skipping: ${publicPaxError.message}`);
          }
        } catch (e) {
          console.error(`Error in cabin/public split queries for ${tableName}:`, e);
          // Continue with zeros for cabin/public counts
        }
      } else {
        console.log(`No 'inside_cabin' field found in ${tableName}, skipping cabin/public split queries`);
      }
      
      // Calculate all counts
      const onlineCrew = onlineCrewCount || 0;
      const onlinePax = onlinePaxCount || 0;
      const totalCrew = totalCrewCount || 0;
      const totalPax = totalPaxCount || 0;
      const offlineCrew = explicitOfflineCrewCount || Math.max(0, totalCrew - onlineCrew);
      const offlinePax = explicitOfflinePaxCount || Math.max(0, totalPax - onlinePax);
      
      const totalOnline = onlineCrew + onlinePax;
      const totalOffline = offlineCrew + offlinePax;
      
      // Calculate offline counts for cabin/public breakdown
      let offlineCabinCrew = 0;
      let offlineCabinPax = 0;
      let offlinePublicCrew = 0;
      let offlinePublicPax = 0;
      
      // Only calculate offline cabin/public splits if the inside_cabin field exists
      if (hasInsideCabinField) {
        try {
          // Get offline cabin crew counts
          const { count: offlineCabinCrewCount, error: offlineCabinCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%crew%')
            .eq(onlineField as any, 'OFFLINE');
          
          if (!offlineCabinCrewError) {
            offlineCabinCrew = offlineCabinCrewCount || 0;
          }
          
          // Get offline cabin pax counts
          const { count: offlineCabinPaxCount, error: offlineCabinPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'yes')
            .ilike('user', '%pax%')
            .eq(onlineField as any, 'OFFLINE');
          
          if (!offlineCabinPaxError) {
            offlineCabinPax = offlineCabinPaxCount || 0;
          }
          
          // Get offline public crew counts
          const { count: offlinePublicCrewCount, error: offlinePublicCrewError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%crew%')
            .eq(onlineField as any, 'OFFLINE');
          
          if (!offlinePublicCrewError) {
            offlinePublicCrew = offlinePublicCrewCount || 0;
          }
          
          // Get offline public pax counts
          const { count: offlinePublicPaxCount, error: offlinePublicPaxError } = await getSupabaseClient()
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .eq('inside_cabin', 'no')
            .ilike('user', '%pax%')
            .eq(onlineField as any, 'OFFLINE');
          
          if (!offlinePublicPaxError) {
            offlinePublicPax = offlinePublicPaxCount || 0;
          }
        } catch (e) {
          console.error(`Error in offline cabin/public split queries for ${tableName}:`, e);
          // Continue with zeros for offline cabin/public counts
        }
      }
      
      const result: ServiceStatus = {
        online: {
          crew: onlineCrew,
          pax: onlinePax,
          total: totalOnline,
          cabinCrew,
          cabinPax,
          publicCrew,
          publicPax
        },
        offline: {
          crew: offlineCrew,
          pax: offlinePax,
          total: totalOffline,
          cabinCrew: offlineCabinCrew,
          cabinPax: offlineCabinPax,
          publicCrew: offlinePublicCrew,
          publicPax: offlinePublicPax
        },
        total: {
          crew: totalCrew,
          pax: totalPax,
          total: totalRecords,
          cabinCrew,
          cabinPax,
          publicCrew,
          publicPax
        }
      };
      
      // Log the raw data for debugging
      console.log(`${tableName} WiFi counts:`, {
        result,
        queryResults: {
          onlineCrewCount,
          onlinePaxCount,
          explicitOfflineCrewCount,
          explicitOfflinePaxCount,
          totalCrewCount,
          totalPaxCount,
          totalCount: totalRecords,
          cabinCrewCount: cabinCrew,
          cabinPaxCount: cabinPax,
          publicCrewCount: publicCrew,
          publicPaxCount: publicPax
        }
      });
      
      return result;
    } catch (error) {
      console.error(`Error processing ${tableName} data:`, error);
      // Return zero counts in case of error to avoid breaking the dashboard
      return {
        online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
        total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
      };
    }

  }

  // Get overall dashboard data
  async getDashboardData(): Promise<DashboardData> {
    // Prevent any dashboard aggregation while on auth routes
    if (typeof window !== 'undefined') {
      const path = window.location.pathname || '';
      if (path.startsWith('/auth')) {
        console.log('[DashboardService] getDashboardData() skipped on auth route:', path);
        return {
          cabinSwitch: { online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 } },
          wifi: { online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 } },
          pbx: { online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 } },
          tv: { online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }, total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 } },
          totalOnline: 0,
          totalOffline: 0,
          totalDevices: 0,
        };
      }
    }
    try {
      // Special debugging for WiFi table
      console.log('Specifically examining WiFi table for offline count issues...');
      const wifiTableName = this.tableWifi;
      
      // Quick check of field structure for WiFi table
      const { data: wifiSample, error: wifiSampleError } = await getSupabaseClient()
        .from(wifiTableName)
        .select('*')
        .limit(1);
      
      if (wifiSample && wifiSample.length > 0) {
        console.log('WiFi table sample row fields:', Object.keys(wifiSample[0]));
        console.log('WiFi online__at_once_ value:', wifiSample[0].online__at_once_);
        console.log('WiFi user value:', wifiSample[0].user);
        console.log('WiFi inside_cabin value:', wifiSample[0].inside_cabin);
      } else {
        console.log('No WiFi sample data available or error:', wifiSampleError);
      }
      
      const [cabinSwitchData, wifiData, pbxData, tvData, latestTimestamp] = await Promise.all([
        this.getServiceCounts(this.tableCabinSwitch),
        this.getServiceCounts(this.tableWifi),
        this.getServiceCounts(this.tablePbx),
        this.getServiceCounts(this.tableTv),
        this.getLatestTimestamp()
      ]);

      console.log('Dashboard data fetched from all services');
      console.log('WiFi data details:', wifiData);
      const totalOnline = cabinSwitchData.online.total + wifiData.online.total + 
                          pbxData.online.total + tvData.online.total;
      
      const totalOffline = cabinSwitchData.offline.total + wifiData.offline.total + 
                           pbxData.offline.total + tvData.offline.total;
      
      const totalDevices = totalOnline + totalOffline;
      
      // Log the dashboard data for debugging
      console.log('Dashboard data summary:', {
        totalOnline,
        totalOffline,
        totalDevices,
        'cabinSwitch online': cabinSwitchData.online,
        'cabinSwitch offline': cabinSwitchData.offline,
        'wifi online': wifiData.online,
        'wifi offline': wifiData.offline,
        'pbx online': pbxData.online,
        'pbx offline': pbxData.offline,
        'tv online': tvData.online,
        'tv offline': tvData.offline
      });
      
      return {
        cabinSwitch: cabinSwitchData,
        wifi: wifiData,
        pbx: pbxData,
        tv: tvData,
        totalOnline,
        totalOffline,
        totalDevices,
        lastUpdated: latestTimestamp || undefined
      };
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      // Return empty data in case of error
      return {
        cabinSwitch: {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        },
        wifi: {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        },
        pbx: {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        },
        tv: {
          online: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          offline: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 },
          total: { crew: 0, pax: 0, total: 0, cabinCrew: 0, cabinPax: 0, publicCrew: 0, publicPax: 0 }
        },
        totalOnline: 0,
        totalOffline: 0,
        totalDevices: 0
      };
    }
  }

  // Get the latest timestamp across key tables (best-effort)
  private async getLatestTimestamp(): Promise<string | null> {
    try {
      const tables = [this.tableCabinSwitch, this.tableWifi, this.tablePbx, this.tableTv];
      const results = await Promise.all(
        tables.map(async (tableName) => {
          try {
            const { data } = await getSupabaseClient()
              .from(tableName)
              .select('created_at,updated_at')
              .order('created_at', { ascending: false })
              .limit(1);
            if (!data || data.length === 0) return null;
            const row: any = data[0];
            return (row.updated_at || row.created_at) as string | null;
          } catch (_) {
            return null;
          }
        })
      );
      const valid = results.filter((x): x is string => !!x);
      if (!valid.length) return null;
      // Return the max timestamp
      return valid.sort().at(-1) || null;
    } catch (_) {
      return null;
    }
  }

  // Get comprehensive data from all tables for AI analysis
  async getAllTableData(): Promise<any> {
    try {
      const results = await Promise.all([
        this.getTableOverview(this.tableCabinSwitch),
        this.getTableOverview(this.tableWifi),
        this.getTableOverview(this.tablePbx),
        this.getTableOverview(this.tableTv),
        this.getTableOverview(this.tableExtracted),
        this.getTableOverview(this.tableFieldCables)
      ]);

      return {
        cabinSwitch: results[0],
        wifi: results[1],
        pbx: results[2],
        tv: results[3],
        extracted: results[4],
        fieldCables: results[5],
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error fetching all table data:', error);
      return null;
    }
  }

  // Get overview data for any table
  private async getTableOverview(tableName: string): Promise<any> {
    try {
      // Get total count
      const { count: totalCount, error: countError } = await getSupabaseClient()
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`Error counting records in ${tableName}:`, countError);
        return { totalCount: 0, error: countError.message };
      }

      // Get sample data to understand structure
      const { data: sampleData, error: sampleError } = await getSupabaseClient()
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (sampleError) {
        console.error(`Error getting sample data from ${tableName}:`, sampleError);
        return { totalCount: totalCount || 0, error: sampleError.message };
      }

      // Get field names if sample data exists
      const fields = sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [];

      return {
        tableName,
        totalCount: totalCount || 0,
        fields,
        sampleData: sampleData?.slice(0, 3) || [], // First 3 records as sample
        lastUpdated: new Date().toISOString()
      };
    } catch (error: any) {
      console.error(`Error in getTableOverview for ${tableName}:`, error);
      return { tableName, totalCount: 0, error: error.message };
    }
  }
}

// Create an instance of the service for use in components
export const dashboardService = new DashboardService();
