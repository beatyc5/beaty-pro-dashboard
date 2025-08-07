import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { queryType } = await request.json();

    let result: any = {};

    switch (queryType) {
      case 'wifi_public':
        result = await executeWifiPublicQuery();
        break;
      case 'wifi_offline':
        result = await executeWifiOfflineQuery();
        break;
      case 'pbx_crew_public':
        result = await executePbxCrewPublicQuery();
        break;
      case 'pbx_offline':
        result = await executePbxOfflineQuery();
        break;
      case 'cctv_passenger':
        result = await executeCctvPassengerQuery();
        break;
      case 'cctv_crew':
        result = await executeCctvCrewQuery();
        break;
      case 'tv_status':
        result = await executeTvStatusQuery();
        break;
      case 'system_overview':
        result = await executeSystemOverviewQuery();
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown query type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}

async function executeWifiPublicQuery() {
  try {
    // Get all WiFi data with pagination
    let allWifiData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    while (hasMore && queryCount < 10) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_wifi')
        .select('user, inside_cabin, online__controller_')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Error fetching chunk ${queryCount}:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allWifiData = allWifiData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
      } else {
        hasMore = false;
      }
    }

    // Analyze public WiFi data
    const publicWifi = allWifiData.filter(record => 
      record.inside_cabin?.toLowerCase() !== 'yes'
    );

    const publicCrewWifi = publicWifi.filter(record => 
      record.user?.toLowerCase().includes('crew')
    );

    const publicPaxWifi = publicWifi.filter(record => 
      !record.user?.toLowerCase().includes('crew')
    );

    const publicOnlineWifi = publicWifi.filter(record => 
      record.online__controller_?.toLowerCase() === 'online'
    );

    const publicOfflineWifi = publicWifi.filter(record => 
      record.online__controller_?.toLowerCase() === 'offline'
    );

    return {
      totalPublicWifiDevices: publicWifi.length,
      publicCrewWifi: publicCrewWifi.length,
      publicPassengerWifi: publicPaxWifi.length,
      onlinePublicWifi: publicOnlineWifi.length,
      offlinePublicWifi: publicOfflineWifi.length,
      publicCrewOnline: publicCrewWifi.filter(r => r.online__controller_?.toLowerCase() === 'online').length,
      publicCrewOffline: publicCrewWifi.filter(r => r.online__controller_?.toLowerCase() === 'offline').length,
      publicPassengerOnline: publicPaxWifi.filter(r => r.online__controller_?.toLowerCase() === 'online').length,
      publicPassengerOffline: publicPaxWifi.filter(r => r.online__controller_?.toLowerCase() === 'offline').length
    };
  } catch (error) {
    console.error('Error in WiFi public query:', error);
    return {
      error: 'Failed to execute WiFi public query'
    };
  }
}

async function executeWifiOfflineQuery() {
  try {
    const { data: offlineWifiData, error } = await supabase
      .from('wgc_databasewgc_database_wifi')
      .select('user, inside_cabin, online__controller_')
      .eq('online__controller_', 'OFFLINE');

    if (error) {
      throw error;
    }

    // Analyze offline devices by user type and area
    let crewOffline = 0;
    let paxOffline = 0;
    let cabinCrewOffline = 0;
    let cabinPaxOffline = 0;
    let publicCrewOffline = 0;
    let publicPaxOffline = 0;

    offlineWifiData?.forEach(record => {
      const userType = record.user?.toLowerCase() || '';
      const isCabin = record.inside_cabin?.toLowerCase() === 'yes';

      if (userType.includes('crew')) {
        crewOffline++;
        if (isCabin) {
          cabinCrewOffline++;
        } else {
          publicCrewOffline++;
        }
      } else {
        paxOffline++;
        if (isCabin) {
          cabinPaxOffline++;
        } else {
          publicPaxOffline++;
        }
      }
    });

    return {
      totalOfflineWifiDevices: offlineWifiData?.length || 0,
      offlinePercentage: ((offlineWifiData?.length || 0) / 4671 * 100).toFixed(1),
      crewOffline,
      passengerOffline: paxOffline,
      cabinAreaOffline: cabinCrewOffline + cabinPaxOffline,
      publicAreaOffline: publicCrewOffline + publicPaxOffline,
      cabinCrewOffline,
      cabinPassengerOffline: cabinPaxOffline,
      publicCrewOffline,
      publicPassengerOffline: publicPaxOffline
    };
  } catch (error) {
    console.error('Error in WiFi offline query:', error);
    return {
      error: 'Failed to execute WiFi offline query'
    };
  }
}

async function executePbxCrewPublicQuery() {
  try {
    // Get all PBX data with pagination
    let allPbxData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    while (hasMore && queryCount < 10) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_pbx')
        .select('user, inside_cabin, online__controller_')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Error fetching chunk ${queryCount}:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allPbxData = allPbxData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
      } else {
        hasMore = false;
      }
    }

    // Analyze crew public PBX data
    const publicPbx = allPbxData.filter(record => 
      record.inside_cabin?.toLowerCase() !== 'yes'
    );

    const publicCrewPbx = publicPbx.filter(record => 
      record.user?.toLowerCase().includes('crew')
    );

    const publicCrewOnlinePbx = publicCrewPbx.filter(record => 
      record.online__controller_?.toLowerCase() === 'online'
    );

    const publicCrewOfflinePbx = publicCrewPbx.filter(record => 
      record.online__controller_?.toLowerCase() === 'offline'
    );

    return {
      totalPublicPbxDevices: publicPbx.length,
      publicCrewPhones: publicCrewPbx.length,
      publicPassengerPhones: publicPbx.length - publicCrewPbx.length,
      onlineCrewPublicPhones: publicCrewOnlinePbx.length,
      offlineCrewPublicPhones: publicCrewOfflinePbx.length,
      publicCrewOnline: publicCrewOnlinePbx.length,
      publicCrewOffline: publicCrewOfflinePbx.length,
      publicPassengerOnline: publicPbx.filter(r => !r.user?.toLowerCase().includes('crew') && r.online__controller_?.toLowerCase() === 'online').length,
      publicPassengerOffline: publicPbx.filter(r => !r.user?.toLowerCase().includes('crew') && r.online__controller_?.toLowerCase() === 'offline').length
    };
  } catch (error) {
    console.error('Error in PBX crew public query:', error);
    return {
      error: 'Failed to execute PBX crew public query'
    };
  }
}

async function executePbxOfflineQuery() {
  try {
    const { data: offlinePhoneData, error } = await supabase
      .from('wgc_databasewgc_database_pbx')
      .select('primary_cabin__rccl_, user, online__controller_')
      .eq('online__controller_', 'OFFLINE')
      .not('primary_cabin__rccl_', 'is', null);

    if (error) {
      throw error;
    }

    // Group offline phones by cabin
    const offlineByCabin: { [key: string]: { crew: number, pax: number, total: number } } = {};
    offlinePhoneData?.forEach(record => {
      const cabinNumber = record.primary_cabin__rccl_;
      const userType = record.user?.toLowerCase().includes('crew') ? 'crew' : 'pax';

      if (cabinNumber) {
        if (!offlineByCabin[cabinNumber]) {
          offlineByCabin[cabinNumber] = { crew: 0, pax: 0, total: 0 };
        }
        offlineByCabin[cabinNumber][userType]++;
        offlineByCabin[cabinNumber].total++;
      }
    });

    const cabinsWithOfflinePhones = Object.keys(offlineByCabin).length;
    const totalOfflinePhones = offlinePhoneData?.length || 0;

    return {
      totalOfflinePbxDevices: totalOfflinePhones,
      cabinsWithOfflinePhones,
      crewPhonesOffline: offlinePhoneData?.filter(p => p.user?.toLowerCase().includes('crew')).length || 0,
      passengerPhonesOffline: offlinePhoneData?.filter(p => !p.user?.toLowerCase().includes('crew')).length || 0,
      offlinePercentage: (totalOfflinePhones / 5633 * 100).toFixed(1),
      cabinBreakdown: offlineByCabin
    };
  } catch (error) {
    console.error('Error in PBX offline query:', error);
    return {
      error: 'Failed to execute PBX offline query'
    };
  }
}

async function executeCctvPassengerQuery() {
  try {
    // Get all CCTV data with pagination
    let allCctvData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    while (hasMore && queryCount < 20) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_field_cables')
        .select('user, system, installed')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Error fetching chunk ${queryCount}:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allCctvData = allCctvData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
      } else {
        hasMore = false;
      }
    }

    // Check if user field exists
    const hasUserField = allCctvData.length > 0 && 'user' in allCctvData[0];

    if (hasUserField) {
      // Count by user type
      const crewCctv = allCctvData.filter(record => 
        record.user?.toLowerCase().includes('crew')
      ).length;
      const paxCctv = allCctvData.filter(record => 
        !record.user?.toLowerCase().includes('crew')
      ).length;

      const installedPaxCctv = allCctvData.filter(record => 
        !record.user?.toLowerCase().includes('crew') && 
        (record.installed?.toLowerCase() === 'yes' || record.installed?.toLowerCase() === 'installed')
      ).length;

      return {
        totalCctvFieldCables: allCctvData.length,
        passengerCctvCables: paxCctv,
        crewCctvCables: crewCctv,
        installedPassengerCables: installedPaxCctv,
        notInstalledPassengerCables: paxCctv - installedPaxCctv
      };
    } else {
      // If no user field, analyze by system type for passenger areas
      const passengerSystems = ['cctv', 'cctv ws', 'pc/printer', 'pos', 'slot'];
      const paxCctv = allCctvData.filter(record => 
        passengerSystems.includes(record.system?.toLowerCase() || '')
      ).length;

      return {
        totalCctvFieldCables: allCctvData.length,
        passengerAreaCctvCables: paxCctv,
        note: 'Passenger area analysis based on system type classification'
      };
    }
  } catch (error) {
    console.error('Error in CCTV passenger query:', error);
    return {
      error: 'Failed to execute CCTV passenger query'
    };
  }
}

async function executeCctvCrewQuery() {
  try {
    // Get all CCTV data with pagination
    let allCctvData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    while (hasMore && queryCount < 20) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_field_cables')
        .select('user, system, installed')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Error fetching chunk ${queryCount}:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allCctvData = allCctvData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
      } else {
        hasMore = false;
      }
    }

    // Check if user field exists
    const hasUserField = allCctvData.length > 0 && 'user' in allCctvData[0];

    if (hasUserField) {
      // Count by user type
      const crewCctv = allCctvData.filter(record => 
        record.user?.toLowerCase().includes('crew')
      ).length;
      const paxCctv = allCctvData.filter(record => 
        !record.user?.toLowerCase().includes('crew')
      ).length;

      const installedCrewCctv = allCctvData.filter(record => 
        record.user?.toLowerCase().includes('crew') && 
        (record.installed?.toLowerCase() === 'yes' || record.installed?.toLowerCase() === 'installed')
      ).length;

      return {
        totalCctvFieldCables: allCctvData.length,
        crewCctvCables: crewCctv,
        passengerCctvCables: paxCctv,
        installedCrewCables: installedCrewCctv,
        notInstalledCrewCables: crewCctv - installedCrewCctv
      };
    } else {
      // If no user field, analyze by system type for crew areas
      const crewSystems = ['cabin switch', 'pbx', 'wifi', 'technical', 'technical modified', 'central clock', 'ds', 'module housing'];
      const crewCctv = allCctvData.filter(record => 
        crewSystems.includes(record.system?.toLowerCase() || '')
      ).length;

      return {
        totalCctvFieldCables: allCctvData.length,
        crewAreaCctvCables: crewCctv,
        note: 'Crew area analysis based on system type classification'
      };
    }
  } catch (error) {
    console.error('Error in CCTV crew query:', error);
    return {
      error: 'Failed to execute CCTV crew query'
    };
  }
}

async function executeTvStatusQuery() {
  try {
    const { data: tvData, error } = await supabase
      .from('wgc_databasewgc_database_tv')
      .select('user, online__controller_');

    if (error) {
      throw error;
    }

    const totalTvDevices = tvData?.length || 0;
    const onlineTvDevices = tvData?.filter(t => t.online__controller_?.toLowerCase() === 'online').length || 0;
    const offlineTvDevices = tvData?.filter(t => t.online__controller_?.toLowerCase() === 'offline').length || 0;

    const crewTvDevices = tvData?.filter(t => t.user?.toLowerCase().includes('crew')).length || 0;
    const passengerTvDevices = tvData?.filter(t => !t.user?.toLowerCase().includes('crew')).length || 0;

    return {
      totalTvDevices,
      onlineTvDevices,
      offlineTvDevices,
      onlinePercentage: (onlineTvDevices / totalTvDevices * 100).toFixed(1),
      crewTvDevices,
      passengerTvDevices,
      crewOnline: tvData?.filter(t => t.user?.toLowerCase().includes('crew') && t.online__controller_?.toLowerCase() === 'online').length || 0,
      crewOffline: tvData?.filter(t => t.user?.toLowerCase().includes('crew') && t.online__controller_?.toLowerCase() === 'offline').length || 0,
      passengerOnline: tvData?.filter(t => !t.user?.toLowerCase().includes('crew') && t.online__controller_?.toLowerCase() === 'online').length || 0,
      passengerOffline: tvData?.filter(t => !t.user?.toLowerCase().includes('crew') && t.online__controller_?.toLowerCase() === 'offline').length || 0
    };
  } catch (error) {
    console.error('Error in TV status query:', error);
    return {
      error: 'Failed to execute TV status query'
    };
  }
}

async function executeSystemOverviewQuery() {
  try {
    // Get counts from all systems
    const [wifiCount, pbxCount, tvCount, cctvCount] = await Promise.all([
      supabase.from('wgc_databasewgc_database_wifi').select('*', { count: 'exact', head: true }),
      supabase.from('wgc_databasewgc_database_pbx').select('*', { count: 'exact', head: true }),
      supabase.from('wgc_databasewgc_database_tv').select('*', { count: 'exact', head: true }),
      supabase.from('wgc_databasewgc_database_field_cables').select('*', { count: 'exact', head: true })
    ]);

    const totalDevices = (wifiCount.count || 0) + (pbxCount.count || 0) + (tvCount.count || 0) + (cctvCount.count || 0);

    return {
      totalDevices,
      wifiDevices: wifiCount.count || 0,
      pbxDevices: pbxCount.count || 0,
      tvDevices: tvCount.count || 0,
      cctvFieldCables: cctvCount.count || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in system overview query:', error);
    return {
      error: 'Failed to execute system overview query'
    };
  }
} 