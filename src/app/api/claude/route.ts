import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 === CLAUDE API CALLED ===');
    console.log('🚀 Request received at:', new Date().toISOString());
    
    const { message, queryType, systemType, instructions } = await request.json();
    
    console.log('🚀 === REQUEST PARAMETERS ===');
    console.log('🚀 Message:', message);
    console.log('🚀 QueryType:', queryType);
    console.log('🚀 SystemType:', systemType);
    console.log('🚀 Instructions:', instructions);

    // Get comprehensive data from all systems with proper pagination
    const allSystemsData = await getAllSystemsDataWithPagination();
    
    // Log the parameters we received
    console.log('Claude API parameters:', { message, queryType, systemType, instructions });
    
    // Send to Claude for reasoning with complete dataset
    const claudeResponse = await queryClaude(message, allSystemsData, systemType, instructions);

    return NextResponse.json({ 
      content: claudeResponse,
      data: allSystemsData 
    });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function getAllSystemsDataWithPagination() {
  try {
    console.log('Starting comprehensive data collection from all systems...');
    
    // Get data from all 6 systems with full pagination
    const [wifiData, pbxData, tvData, cctvData, extractedData, cabinSwitchData] = await Promise.all([
      getCompleteWifiData(),
      getCompletePbxData(),
      getCompleteTvData(),
      getCompleteCctvData(),
      getCompleteExtractedData(),
      getCompleteCabinSwitchData()
    ]);

    console.log('Data collection completed. Processing cross-system analysis...');

    // Perform cross-system analysis
    const crossSystemAnalysis = analyzeCrossSystemData({
      wifi: wifiData,
      pbx: pbxData,
      tv: tvData,
      cctv: cctvData,
      extracted: extractedData,
      cabinSwitch: cabinSwitchData
    });

    return {
      systems: {
        wifi: wifiData,
        pbx: pbxData,
        tv: tvData,
        cctv: cctvData,
        extracted: extractedData,
        cabinSwitch: cabinSwitchData
      },
      crossSystem: crossSystemAnalysis,
      summary: {
        totalRecords: wifiData.totalRecords + pbxData.totalRecords + tvData.totalRecords + 
                     cctvData.totalRecords + extractedData.totalRecords + cabinSwitchData.totalRecords,
        systems: ['WiFi', 'PBX', 'TV', 'CCTV', 'Extracted', 'Cabin Switch'],
        lastUpdated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in comprehensive data collection:', error);
    return null;
  }
}

async function getCompleteWifiData() {
  try {
    let allWifiData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    console.log('Fetching complete WiFi data...');

    while (hasMore && queryCount < 20) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_wifi')
        .select('*')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`WiFi chunk ${queryCount} error:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allWifiData = allWifiData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
        console.log(`WiFi chunk ${queryCount}: ${chunkData.length} records (Total: ${allWifiData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`WiFi data complete: ${allWifiData.length} total records`);

    const analysis = analyzeWifiData(allWifiData);
    
    return {
      totalRecords: allWifiData.length,
      rawData: allWifiData,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in WiFi data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

async function getCompletePbxData() {
  try {
    let allPbxData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    console.log('Fetching complete PBX data...');

    while (hasMore && queryCount < 20) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_pbx')
        .select('*')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`PBX chunk ${queryCount} error:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allPbxData = allPbxData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
        console.log(`PBX chunk ${queryCount}: ${chunkData.length} records (Total: ${allPbxData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`PBX data complete: ${allPbxData.length} total records`);

    const analysis = analyzePbxData(allPbxData);
    
    return {
      totalRecords: allPbxData.length,
      rawData: allPbxData,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in PBX data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

async function getCompleteTvData() {
  try {
    let allTvData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    console.log('Fetching complete TV data...');

    while (hasMore && queryCount < 20) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_tv')
        .select('*')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`TV chunk ${queryCount} error:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allTvData = allTvData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
        console.log(`TV chunk ${queryCount}: ${chunkData.length} records (Total: ${allTvData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`TV data complete: ${allTvData.length} total records`);

    const analysis = analyzeTvData(allTvData);
    
    return {
      totalRecords: allTvData.length,
      rawData: allTvData,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in TV data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

async function getCompleteCctvData() {
  try {
    // Fetch from both extracted table and field_cables table
    const [extractedData, fieldCablesData] = await Promise.all([
      getExtractedTableData(),
      getFieldCablesData()
    ]);

    // Filter for CCTV-related records from extracted data
    const cctvFromExtracted = extractedData.filter(record => {
      const systemType = (record.system || '').toLowerCase();
      const deviceType = (record.device_type || '').toLowerCase();
      const deviceName = (record.device_name || '').toLowerCase();
      
      return systemType.includes('cctv') || 
             systemType.includes('camera') ||
             deviceType.includes('cctv') ||
             deviceType.includes('camera') ||
             deviceName.includes('camera') ||
             deviceName.includes('cctv');
    });

    // Filter for CCTV-related records from field cables
    const cctvFromFieldCables = fieldCablesData.filter(record => {
      const systemType = (record.system || '').toLowerCase();
      const deviceType = (record.device_type || '').toLowerCase();
      const deviceName = (record.device_name || '').toLowerCase();
      const cableType = (record.cable_type || '').toLowerCase();
      
      return systemType.includes('cctv') || 
             systemType.includes('camera') ||
             deviceType.includes('cctv') ||
             deviceType.includes('camera') ||
             deviceName.includes('camera') ||
             deviceName.includes('cctv') ||
             cableType.includes('cctv') ||
             cableType.includes('camera');
    });

    // Combine CCTV data from both sources
    const allCctvData = [...cctvFromExtracted, ...cctvFromFieldCables];

    console.log(`CCTV data collected: ${cctvFromExtracted.length} from extracted table, ${cctvFromFieldCables.length} from field cables table`);
    console.log(`Total CCTV records: ${allCctvData.length}`);

    const analysis = analyzeCctvData(allCctvData);
    
    return {
      totalRecords: allCctvData.length,
      rawData: allCctvData,
      extractedData: extractedData,
      fieldCablesData: fieldCablesData,
      cctvFromExtracted: cctvFromExtracted,
      cctvFromFieldCables: cctvFromFieldCables,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in CCTV data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

async function getExtractedTableData() {
  let allExtractedData: any[] = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  let queryCount = 0;

  console.log('Fetching data from extracted table...');

  while (hasMore && queryCount < 20) {
    queryCount++;
    const { data: chunkData, error: chunkError } = await supabase
      .from('wgc_databasewgc_database_extracted')
      .select('*')
      .range(offset, offset + limit - 1);

    if (chunkError) {
      console.error(`Extracted data chunk ${queryCount} error:`, chunkError);
      break;
    }

    if (chunkData && chunkData.length > 0) {
      allExtractedData = allExtractedData.concat(chunkData);
      offset += limit;
      hasMore = chunkData.length === limit;
      console.log(`Extracted data chunk ${queryCount}: ${chunkData.length} records (Total: ${allExtractedData.length})`);
    } else {
      hasMore = false;
    }
  }

  return allExtractedData;
}

async function getFieldCablesData() {
  let allFieldCablesData: any[] = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;
  let queryCount = 0;

  console.log('Fetching data from field_cables table...');

  while (hasMore && queryCount < 20) {
    queryCount++;
    const { data: chunkData, error: chunkError } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*')
      .range(offset, offset + limit - 1);

    if (chunkError) {
      console.error(`Field cables chunk ${queryCount} error:`, chunkError);
      break;
    }

    if (chunkData && chunkData.length > 0) {
      allFieldCablesData = allFieldCablesData.concat(chunkData);
      offset += limit;
      hasMore = chunkData.length === limit;
      console.log(`Field cables chunk ${queryCount}: ${chunkData.length} records (Total: ${allFieldCablesData.length})`);
    } else {
      hasMore = false;
    }
  }

  return allFieldCablesData;
}

async function getCompleteExtractedData() {
  try {
    let allExtractedData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    console.log('Fetching complete extracted data...');

    while (hasMore && queryCount < 10) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_extracted')
        .select('*')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Extracted data chunk ${queryCount} error:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allExtractedData = allExtractedData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
        console.log(`Extracted data chunk ${queryCount}: ${chunkData.length} records (Total: ${allExtractedData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`Extracted data complete: ${allExtractedData.length} total records`);

    const analysis = analyzeExtractedData(allExtractedData);
    
    return {
      totalRecords: allExtractedData.length,
      rawData: allExtractedData,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in extracted data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

async function getCompleteCabinSwitchData() {
  try {
    let allCabinSwitchData: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;
    let queryCount = 0;

    console.log('Fetching complete cabin switch data...');

    while (hasMore && queryCount < 10) {
      queryCount++;
      const { data: chunkData, error: chunkError } = await supabase
        .from('wgc_databasewgc_database_cabin_switch')
        .select('*')
        .range(offset, offset + limit - 1);

      if (chunkError) {
        console.error(`Cabin switch chunk ${queryCount} error:`, chunkError);
        break;
      }

      if (chunkData && chunkData.length > 0) {
        allCabinSwitchData = allCabinSwitchData.concat(chunkData);
        offset += limit;
        hasMore = chunkData.length === limit;
        console.log(`Cabin switch chunk ${queryCount}: ${chunkData.length} records (Total: ${allCabinSwitchData.length})`);
      } else {
        hasMore = false;
      }
    }

    console.log(`Cabin switch data complete: ${allCabinSwitchData.length} total records`);

    const analysis = analyzeCabinSwitchData(allCabinSwitchData);
    
    return {
      totalRecords: allCabinSwitchData.length,
      rawData: allCabinSwitchData,
      analysis: analysis
    };
  } catch (error) {
    console.error('Error in cabin switch data collection:', error);
    return { totalRecords: 0, rawData: [], analysis: {} };
  }
}

function analyzeWifiData(wifiData: any[]) {
  const totalDevices = wifiData.length;
  const onlineDevices = wifiData.filter(device => device.status === 'online' || device.online === 'yes').length;
  const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
  
  // Logical analysis: Group WiFi devices by cabin to understand distribution
  const cabinWifiCounts = new Map();
  const validCabins = wifiData.filter(device => device.cabin || device.primary_cabin__rccl_);
  
  validCabins.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    // Filter out invalid cabin identifiers (same fix as PBX)
    if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
      cabinWifiCounts.set(cabin, (cabinWifiCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Analyze cabin WiFi distribution patterns
  const cabinDistribution = {
    single: 0,    // Cabins with 1 WiFi device
    double: 0,    // Cabins with 2 WiFi devices
    triple: 0,    // Cabins with 3 WiFi devices
    multiple: 0   // Cabins with 4+ WiFi devices
  };
  
  const cabinWifiCountsArray = Array.from(cabinWifiCounts.values());
  cabinWifiCountsArray.forEach(count => {
    if (count === 1) cabinDistribution.single++;
    else if (count === 2) cabinDistribution.double++;
    else if (count === 3) cabinDistribution.triple++;
    else if (count >= 4) cabinDistribution.multiple++;
  });
  
  const uniqueCabins = cabinWifiCounts.size;
  const crewDevices = wifiData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'crew' || area === 'crew' || areaType === 'crew';
  }).length;
  
  const passengerDevices = wifiData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'passenger' || user === 'pax' || area === 'passenger' || area === 'pax' || areaType === 'passenger';
  }).length;
  
  console.log(`WiFi Analysis Results:`);
  console.log(`- Total WiFi devices: ${totalDevices}`);
  console.log(`- Unique cabins with WiFi: ${uniqueCabins}`);
  console.log(`- Cabins with 1 WiFi device: ${cabinDistribution.single}`);
  console.log(`- Cabins with 2 WiFi devices: ${cabinDistribution.double}`);
  console.log(`- Cabins with 3 WiFi devices: ${cabinDistribution.triple}`);
  console.log(`- Cabins with 4+ WiFi devices: ${cabinDistribution.multiple}`);
  
  return {
    totalDevices,
    onlineDevices,
    onlinePercentage,
    uniqueCabins,
    crewDevices,
    passengerDevices,
    coverageRate: onlinePercentage,
    // Enhanced logical analysis
    cabinDistribution,
    cabinsWithMultipleWifi: cabinDistribution.double + cabinDistribution.triple + cabinDistribution.multiple,
    cabinsWithTwoWifi: cabinDistribution.double,
    cabinsWithThreeWifi: cabinDistribution.triple,
    cabinsWithFourOrMoreWifi: cabinDistribution.multiple,
    averageWifiPerCabin: uniqueCabins > 0 ? Math.round((totalDevices / uniqueCabins) * 100) / 100 : 0,
    cabinWifiCounts: Object.fromEntries(cabinWifiCounts),
    maxWifiInSingleCabin: cabinWifiCountsArray.length > 0 ? Math.max(...cabinWifiCountsArray) : 0
  };
}

function analyzePbxData(pbxData: any[]) {
  const totalDevices = pbxData.length;
  const onlineDevices = pbxData.filter(device => device.status === 'online' || device.online === 'yes').length;
  const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
  
  // Logical analysis: Group PBX devices by cabin to understand distribution
  const cabinPbxCounts = new Map();
  const validCabins = pbxData.filter(device => device.cabin || device.primary_cabin__rccl_);
  
  validCabins.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    if (cabin) {
      cabinPbxCounts.set(cabin, (cabinPbxCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Analyze cabin PBX distribution patterns
  const cabinDistribution = {
    single: 0,    // Cabins with 1 phone
    double: 0,    // Cabins with 2 phones
    triple: 0,    // Cabins with 3 phones
    multiple: 0   // Cabins with 4+ phones
  };
  
  const cabinPbxCountsArray = Array.from(cabinPbxCounts.values());
  cabinPbxCountsArray.forEach(count => {
    if (count === 1) cabinDistribution.single++;
    else if (count === 2) cabinDistribution.double++;
    else if (count === 3) cabinDistribution.triple++;
    else if (count >= 4) cabinDistribution.multiple++;
  });
  
  const uniqueCabins = cabinPbxCounts.size;
  const crewDevices = pbxData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'crew' || area === 'crew' || areaType === 'crew';
  }).length;
  
  const passengerDevices = pbxData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'passenger' || user === 'pax' || area === 'passenger' || area === 'pax' || areaType === 'passenger';
  }).length;
  
  // Phone-specific analysis
  const extensionTypes = [...new Set(pbxData.map(device => device.extension_type).filter(type => type))];
  const phoneTypes = [...new Set(pbxData.map(device => device.phone_type).filter(type => type))];
  
  console.log(`PBX Analysis Results:`);
  console.log(`- Total PBX devices: ${totalDevices}`);
  console.log(`- Unique cabins with phones: ${uniqueCabins}`);
  console.log(`- Cabins with 1 phone: ${cabinDistribution.single}`);
  console.log(`- Cabins with 2 phones: ${cabinDistribution.double}`);
  console.log(`- Cabins with 3 phones: ${cabinDistribution.triple}`);
  console.log(`- Cabins with 4+ phones: ${cabinDistribution.multiple}`);
  
  return {
    totalDevices,
    onlineDevices,
    onlinePercentage,
    uniqueCabins,
    crewDevices,
    passengerDevices,
    extensionTypes,
    phoneTypes,
    coverageRate: onlinePercentage,
    // Enhanced logical analysis
    cabinDistribution,
    cabinsWithMultiplePhones: cabinDistribution.double + cabinDistribution.triple + cabinDistribution.multiple,
    cabinsWithTwoPhones: cabinDistribution.double,
    cabinsWithThreePhones: cabinDistribution.triple,
    cabinsWithFourOrMorePhones: cabinDistribution.multiple,
    averagePhonesPerCabin: uniqueCabins > 0 ? Math.round((totalDevices / uniqueCabins) * 100) / 100 : 0,
    cabinPbxCounts: Object.fromEntries(cabinPbxCounts),
    maxPhonesInSingleCabin: cabinPbxCountsArray.length > 0 ? Math.max(...cabinPbxCountsArray) : 0
  };
}

function analyzeTvData(tvData: any[]) {
  const totalDevices = tvData.length;
  const onlineDevices = tvData.filter(device => device.status === 'online' || device.online === 'yes').length;
  const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
  
  // Logical analysis: Group TVs by cabin to understand distribution
  const cabinTvCounts = new Map();
  const validCabins = tvData.filter(device => device.cabin || device.primary_cabin__rccl_);
  
  validCabins.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    // Filter out invalid cabin identifiers (same fix as PBX and WiFi)
    if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
      cabinTvCounts.set(cabin, (cabinTvCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Analyze cabin TV distribution patterns
  const cabinDistribution = {
    single: 0,    // Cabins with 1 TV
    double: 0,    // Cabins with 2 TVs
    triple: 0,    // Cabins with 3 TVs
    multiple: 0   // Cabins with 4+ TVs
  };
  
  const cabinTvCountsArray = Array.from(cabinTvCounts.values());
  cabinTvCountsArray.forEach(count => {
    if (count === 1) cabinDistribution.single++;
    else if (count === 2) cabinDistribution.double++;
    else if (count === 3) cabinDistribution.triple++;
    else if (count >= 4) cabinDistribution.multiple++;
  });
  
  const uniqueCabins = cabinTvCounts.size;
  const crewDevices = tvData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'crew' || area === 'crew' || areaType === 'crew';
  }).length;
  
  const passengerDevices = tvData.filter(device => {
    const user = (device.user || '').toLowerCase();
    const area = (device.area || '').toLowerCase();
    const areaType = (device.area_type || '').toLowerCase();
    return user === 'passenger' || user === 'pax' || area === 'passenger' || area === 'pax' || areaType === 'passenger';
  }).length;
  
  console.log(`TV Analysis Results:`);
  console.log(`- Total TV devices: ${totalDevices}`);
  console.log(`- Unique cabins with TVs: ${uniqueCabins}`);
  console.log(`- Cabins with 1 TV: ${cabinDistribution.single}`);
  console.log(`- Cabins with 2 TVs: ${cabinDistribution.double}`);
  console.log(`- Cabins with 3 TVs: ${cabinDistribution.triple}`);
  console.log(`- Cabins with 4+ TVs: ${cabinDistribution.multiple}`);
  console.log(`- Crew area TVs: ${crewDevices}`);
  console.log(`- Passenger area TVs: ${passengerDevices}`);
  
  return {
    totalDevices,
    onlineDevices,
    onlinePercentage,
    uniqueCabins,
    crewDevices,
    passengerDevices,
    coverageRate: onlinePercentage,
    // Enhanced logical analysis
    cabinDistribution,
    cabinsWithMultipleTvs: cabinDistribution.double + cabinDistribution.triple + cabinDistribution.multiple,
    cabinsWithTwoTvs: cabinDistribution.double,
    cabinsWithThreeTvs: cabinDistribution.triple,
    cabinsWithFourOrMoreTvs: cabinDistribution.multiple,
    averageTvsPerCabin: uniqueCabins > 0 ? Math.round((totalDevices / uniqueCabins) * 100) / 100 : 0,
    cabinTvCounts: Object.fromEntries(cabinTvCounts), // Raw cabin counts for detailed analysis
    maxTvsInSingleCabin: cabinTvCountsArray.length > 0 ? Math.max(...cabinTvCountsArray) : 0
  };
}

function analyzeCctvData(cctvData: any[]) {
  const totalCables = cctvData.length;
  
  console.log(`Analyzing ${totalCables} CCTV records...`);
  
  // Debug: Log first few records to understand data structure
  if (cctvData.length > 0) {
    console.log('Sample CCTV record fields:', Object.keys(cctvData[0]));
    console.log('Sample CCTV record:', cctvData[0]);
  }
  
  // Focus on crew area analysis - check multiple possible field names for crew areas
  // Handle both uppercase and lowercase variations
  const crewCables = cctvData.filter(cable => {
    const userField = (cable.user || '').toString().toLowerCase();
    const areaField = (cable.area || '').toString().toLowerCase();
    const locationField = (cable.location || '').toString().toLowerCase();
    const detailField = (cable.detail || '').toString().toLowerCase();
    
    const isCrew = userField === 'crew' ||
                   areaField === 'crew' ||
                   locationField.includes('crew') ||
                   detailField.includes('crew');
    
    if (isCrew) {
      console.log('Found crew CCTV cable:', {
        cable_id: cable.cable_id,
        user: cable.user,
        area: cable.area,
        location: cable.location
      });
    }
    
    return isCrew;
  });
  
  const passengerCables = cctvData.filter(cable => {
    const userField = (cable.user || '').toString().toLowerCase();
    const areaField = (cable.area || '').toString().toLowerCase();
    const locationField = (cable.location || '').toString().toLowerCase();
    const detailField = (cable.detail || '').toString().toLowerCase();
    
    return userField === 'passenger' ||
           userField === 'pax' ||
           areaField === 'passenger' ||
           areaField === 'pax' ||
           locationField.includes('passenger') ||
           locationField.includes('pax') ||
           detailField.includes('passenger') ||
           detailField.includes('pax');
  });
  
  // Use 'system' field for system types
  const systemTypes = [...new Set(cctvData.map(cable => cable.system).filter(type => type))];
  const uniqueLocations = new Set(cctvData.map(cable => cable.location).filter(location => location)).size;
  const uniqueCabins = new Set(cctvData.map(cable => cable.primary_cabin__rccl_).filter(cabin => cabin)).size;
  
  // Calculate crew area percentage
  const crewPercentage = totalCables > 0 ? Math.round((crewCables.length / totalCables) * 100) : 0;
  
  console.log(`CCTV Analysis Results:`);
  console.log(`- Total CCTV cables: ${totalCables}`);
  console.log(`- Crew area cables: ${crewCables.length}`);
  console.log(`- Passenger area cables: ${passengerCables.length}`);
  console.log(`- Crew coverage: ${crewPercentage}%`);
  
  return {
    totalCables,
    totalDevices: totalCables, // For consistency with other systems
    crewCables: crewCables.length, // Main metric for crew areas
    passengerCables: passengerCables.length,
    crewPercentage,
    systemTypes,
    uniqueLocations,
    uniqueCabins,
    crewDevices: crewCables.length, // Alias for consistency
    passengerDevices: passengerCables.length, // Alias for consistency
    coverageRate: crewPercentage, // Focus on crew coverage
    rawCrewCables: crewCables, // Keep actual records for debugging
    rawPassengerCables: passengerCables // Keep actual records for debugging
  };
}

function analyzeExtractedData(extractedData: any[]) {
  const totalRecords = extractedData.length;
  const processedRecords = extractedData.filter(record => record.processed === 'yes' || record.status === 'processed').length;
  const processingPercentage = totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0;
  
  return {
    totalRecords,
    processedRecords,
    processingPercentage,
    coverageRate: processingPercentage
  };
}

function analyzeCabinSwitchData(cabinSwitchData: any[]) {
  const totalDevices = cabinSwitchData.length;
  const onlineDevices = cabinSwitchData.filter(device => device.status === 'online' || device.online === 'yes').length;
  const onlinePercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
  
  const uniqueCabins = new Set(cabinSwitchData.map(device => device.cabin).filter(cabin => cabin)).size;
  const crewDevices = cabinSwitchData.filter(device => device.area_type === 'crew' || device.user === 'crew').length;
  const passengerDevices = cabinSwitchData.filter(device => device.area_type === 'passenger' || device.user === 'passenger').length;
  
  return {
    totalDevices,
    onlineDevices,
    onlinePercentage,
    uniqueCabins,
    crewDevices,
    passengerDevices,
    coverageRate: onlinePercentage
  };
}

function analyzeCrossSystemData(allSystems: any) {
  const systems = allSystems;
  let totalDevices = 0;
  let totalOnline = 0;
  let totalOffline = 0;
  const allCabins = new Set();
  
  Object.values(systems).forEach((system: any) => {
    if (system.analysis) {
      totalDevices += system.analysis.totalDevices || 0;
      totalOnline += system.analysis.onlineDevices || 0;
      totalOffline += (system.analysis.totalDevices || 0) - (system.analysis.onlineDevices || 0);
      
      // Collect unique cabins from raw data
      if (system.rawData && Array.isArray(system.rawData)) {
        system.rawData.forEach((record: any) => {
          const cabin = record.cabin || record.primary_cabin__rccl_;
          if (cabin) allCabins.add(cabin);
        });
      }
    }
  });
  
  return {
    totalDevices,
    totalOnline,
    totalOffline,
    totalUniqueCabins: allCabins.size,
    onlinePercentage: totalDevices > 0 ? Math.round((totalOnline / totalDevices) * 100) : 0
  };
}

function analyzeCrewCabinsWithTwoDevices(rawData: any[], deviceType: string): number {
  if (!rawData || !Array.isArray(rawData)) {
    console.log(`No raw data available for ${deviceType} analysis`);
    return 0;
  }
  
  // Filter for crew devices only
  const crewDevices = rawData.filter(device => {
    const user = (device.user || '').toString().toLowerCase();
    const area = (device.area || '').toString().toLowerCase();
    const areaType = (device.area_type || '').toString().toLowerCase();
    return user === 'crew' || area === 'crew' || areaType === 'crew';
  });
  
  console.log(`Found ${crewDevices.length} crew ${deviceType} devices`);
  
  // Group crew devices by cabin
  const crewCabinCounts = new Map();
  crewDevices.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    if (cabin) {
      crewCabinCounts.set(cabin, (crewCabinCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Count cabins with exactly 2 devices
  let crewCabinsWithTwo = 0;
  crewCabinCounts.forEach((count, cabin) => {
    if (count === 2) {
      crewCabinsWithTwo++;
      console.log(`Crew cabin ${cabin} has exactly 2 ${deviceType}s`);
    }
  });
  
  console.log(`Total crew cabins with exactly 2 ${deviceType}s: ${crewCabinsWithTwo}`);
  return crewCabinsWithTwo;
}

function calculateCabinsWithMoreThan(rawData: any[], systemType: string, threshold: number): number {
  if (!rawData || !Array.isArray(rawData)) {
    console.log(`No raw data available for ${systemType} analysis`);
    return 0;
  }
  
  console.log(`Calculating cabins with more than ${threshold} ${systemType} devices...`);
  
  // Group devices by cabin
  const cabinCounts = new Map();
  rawData.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    // Filter out invalid cabin identifiers (same fix as analysis functions)
    if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
      cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Count cabins with more than threshold devices
  let cabinsWithMoreThan = 0;
  cabinCounts.forEach((count, cabin) => {
    if (count > threshold) {
      cabinsWithMoreThan++;
      console.log(`Cabin ${cabin} has ${count} ${systemType} devices (> ${threshold})`);
    }
  });
  
  console.log(`Total cabins with more than ${threshold} ${systemType} devices: ${cabinsWithMoreThan}`);
  return cabinsWithMoreThan;
}

function getCabinsWithMoreThanThreshold(rawData: any[], systemType: string, threshold: number): string[] {
  if (!rawData || !Array.isArray(rawData)) {
    console.log(`No raw data available for ${systemType} analysis`);
    return [];
  }
  
  console.log(`🎯 === GETTING CABIN LIST WITH MORE THAN ${threshold} ${systemType.toUpperCase()} DEVICES ===`);
  
  // Group devices by cabin
  const cabinCounts = new Map<string, number>();
  rawData.forEach(device => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    // Filter out invalid cabin identifiers (same fix as analysis functions)
    if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
      cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
    }
  });
  
  // Get cabins with more than threshold devices
  const cabinsWithMoreThan: string[] = [];
  cabinCounts.forEach((count, cabin) => {
    if (count > threshold) {
      cabinsWithMoreThan.push(cabin);
      console.log(`🔍 ✅ Cabin ${cabin} has ${count} ${systemType} devices (> ${threshold})`);
    }
  });
  
  // Sort cabin numbers for consistent output
  cabinsWithMoreThan.sort((a, b) => {
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  
  console.log(`🔍 === FINAL RESULT ===`);
  console.log(`🔍 Found ${cabinsWithMoreThan.length} cabins with more than ${threshold} ${systemType} devices`);
  console.log(`🔍 Matching cabins:`, cabinsWithMoreThan.slice(0, 10));
  console.log(`🔍 === END CABIN LISTING DEBUG ===`);
  
  return cabinsWithMoreThan;
}

function getDeviceTypeName(systemType: string): string {
  const deviceNames: { [key: string]: string } = {
    'wifi': 'WiFi devices',
    'tv': 'TVs',
    'pbx': 'phones',
    'cctv': 'CCTV cables',
    'extracted': 'devices',
    'cabinswitch': 'switches'
  };
  
  return deviceNames[systemType.toLowerCase()] || 'devices';
}

function getCabinsWithExactDeviceCount(rawData: any[], systemType: string, targetCount: number): string[] {
  if (!rawData || !Array.isArray(rawData)) {
    console.log(`No raw data available for ${systemType} analysis`);
    return [];
  }
  
  console.log(`🔍 === CABIN COUNTING DEBUG ===`);
  console.log(`🔍 Finding cabins with exactly ${targetCount} ${systemType} devices...`);
  console.log(`🔍 Raw data length: ${rawData.length}`);
  
  // Sample first few records to check data structure
  console.log(`🔍 Sample records (first 3):`);
  for (let i = 0; i < Math.min(3, rawData.length); i++) {
    const device = rawData[i];
    const cabin = device.cabin || device.primary_cabin__rccl_;
    console.log(`🔍 Record ${i}: cabin='${cabin}', primary_cabin__rccl_='${device.primary_cabin__rccl_}', device.cabin='${device.cabin}'`);
  }
  
  // Group devices by cabin
  const cabinCounts = new Map<string, number>();
  let devicesWithCabins = 0;
  let devicesWithoutCabins = 0;
  
  rawData.forEach((device, index) => {
    const cabin = device.cabin || device.primary_cabin__rccl_;
    // Filter out invalid cabin identifiers
    if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
      cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
      devicesWithCabins++;
    } else {
      devicesWithoutCabins++;
      if (index < 5) { // Log first 5 devices without cabins
        console.log(`🔍 Device without cabin [${index}]:`, {
          id: device.id,
          cable_id: device.cable_id,
          location: device.location,
          cabin: device.cabin,
          primary_cabin__rccl_: device.primary_cabin__rccl_
        });
      }
    }
  });
  
  console.log(`🔍 Devices with cabins: ${devicesWithCabins}`);
  console.log(`🔍 Devices without cabins: ${devicesWithoutCabins}`);
  console.log(`🔍 Total unique cabins found: ${cabinCounts.size}`);
  
  // Show cabin count distribution
  const countDistribution = new Map<number, number>();
  cabinCounts.forEach(count => {
    countDistribution.set(count, (countDistribution.get(count) || 0) + 1);
  });
  
  console.log(`🔍 Cabin count distribution:`);
  Array.from(countDistribution.entries()).sort((a, b) => a[0] - b[0]).forEach(([count, cabins]) => {
    console.log(`🔍   ${cabins} cabins have ${count} devices`);
  });
  
  // Show detailed breakdown for counts 1-10
  console.log(`🔍 Detailed breakdown (1-10 devices):`);
  for (let i = 1; i <= 10; i++) {
    const cabinCount = countDistribution.get(i) || 0;
    console.log(`🔍   ${cabinCount} cabins have exactly ${i} devices`);
  }
  
  // Find cabins with exactly targetCount devices
  const matchingCabins: string[] = [];
  cabinCounts.forEach((count, cabin) => {
    if (count === targetCount) {
      matchingCabins.push(cabin);
      console.log(`🔍 ✅ Cabin ${cabin} has exactly ${targetCount} ${systemType} devices`);
    }
  });
  
  // Sort cabin numbers for consistent ordering
  matchingCabins.sort((a, b) => {
    // Try to sort numerically if possible, otherwise alphabetically
    const numA = parseInt(a);
    const numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  
  console.log(`🔍 === FINAL RESULT ===`);
  console.log(`🔍 Found ${matchingCabins.length} cabins with exactly ${targetCount} ${systemType} devices`);
  if (matchingCabins.length > 0) {
    console.log(`🔍 Matching cabins:`, matchingCabins.slice(0, 10)); // Show first 10
  }
  console.log(`🔍 === END CABIN COUNTING DEBUG ===`);
  
  return matchingCabins;
}

// Universal Field Analysis Functions
function getFieldMapping(): { [key: string]: string[] } {
  // Map common field name variations to standardized field names
  return {
    'rdp': ['rdp_yard', 'rdp', 'rdp_name'],
    'switch': ['switch', 'cable_origin__switch_', 'origin_switch'],
    'dk': ['dk', 'deck'],
    'fz': ['fz', 'fire_zone'],
    'cabin': ['cabin', 'primary_cabin__rccl_', 'cabin_number'],
    'device_type': ['device_type', 'device_type__vendor_', 'type'],
    'device_name': ['device_name', 'device_name___extension', 'name'],
    'mac': ['mac_address', 'mac'],
    'user': ['user', 'area_type'],
    'area': ['area', 'location'],
    'system': ['system', 'device_type'],
    'installed': ['installed', 'status'],
    'blade_port': ['blade_port', 'port'],
    'cable_id': ['cable_id', 'id'],
    'frame': ['frame'],
    'side': ['side'],
    'detail': ['detail', 'remarks', 'beaty_remarks']
  };
}

function detectFieldInQuery(query: string): { field: string, standardField: string } | null {
  const lowerQuery = query.toLowerCase();
  const fieldMapping = getFieldMapping();
  
  // Check for field mentions in query
  for (const [standardField, variations] of Object.entries(fieldMapping)) {
    for (const variation of variations) {
      if (lowerQuery.includes(variation.toLowerCase()) || 
          lowerQuery.includes(standardField) ||
          lowerQuery.includes(standardField.replace('_', ' '))) {
        console.log(`Detected field: ${standardField} (variation: ${variation})`);
        return { field: variation, standardField };
      }
    }
  }
  
  return null;
}

function getUniqueFieldValues(rawData: any[], fieldName: string): string[] {
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }
  
  const uniqueValues = new Set<string>();
  rawData.forEach(record => {
    const value = record[fieldName];
    if (value !== null && value !== undefined && value !== '') {
      uniqueValues.add(String(value));
    }
  });
  
  const sortedValues = Array.from(uniqueValues).sort((a, b) => {
    // Try numeric sort first, then alphabetic
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
  
  console.log(`Found ${sortedValues.length} unique values for field '${fieldName}'`);
  return sortedValues;
}

function groupDataByField(rawData: any[], fieldName: string): Map<string, any[]> {
  if (!rawData || !Array.isArray(rawData)) {
    return new Map();
  }
  
  const groupedData = new Map<string, any[]>();
  rawData.forEach(record => {
    const value = record[fieldName];
    if (value !== null && value !== undefined && value !== '') {
      const key = String(value);
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(record);
    }
  });
  
  console.log(`Grouped data by '${fieldName}' into ${groupedData.size} groups`);
  return groupedData;
}

function analyzeFieldDistribution(rawData: any[], fieldName: string): {
  totalRecords: number;
  uniqueValues: number;
  distribution: { value: string, count: number }[];
  topValues: { value: string, count: number }[];
} {
  const groupedData = groupDataByField(rawData, fieldName);
  const distribution: { value: string, count: number }[] = [];
  
  groupedData.forEach((records, value) => {
    distribution.push({ value, count: records.length });
  });
  
  // Sort by count descending
  distribution.sort((a, b) => b.count - a.count);
  
  return {
    totalRecords: rawData.length,
    uniqueValues: distribution.length,
    distribution,
    topValues: distribution.slice(0, 10) // Top 10 most common values
  };
}

function handleUniversalFieldQuery(
  query: string, 
  systemType: string, 
  systemData: any, 
  detectedField: { field: string, standardField: string },
  instructions?: string
): string {
  const lowerQuery = query.toLowerCase();
  const allData = getAllSystemsData(systemData);
  const { field, standardField } = detectedField;
  
  console.log(`Processing universal field query for: ${standardField} (${field})`);
  
  // Find the actual field name in the data
  let actualFieldName = field;
  if (allData.length > 0) {
    const sampleRecord = allData[0];
    const fieldMapping = getFieldMapping();
    const variations = fieldMapping[standardField] || [field];
    
    for (const variation of variations) {
      if (sampleRecord.hasOwnProperty(variation)) {
        actualFieldName = variation;
        break;
      }
    }
  }
  
  console.log(`Using actual field name: ${actualFieldName}`);
  
  // Handle different types of field queries
  if (lowerQuery.includes('how many') && (lowerQuery.includes('unique') || lowerQuery.includes('different'))) {
    // "How many unique RDPs are there?"
    const uniqueValues = getUniqueFieldValues(allData, actualFieldName);
    return generateFieldCountResponse(standardField, uniqueValues, allData.length);
  }
  
  if (lowerQuery.includes('list') && !lowerQuery.includes('cabin')) {
    // "List all switches" or "List RDPs"
    const uniqueValues = getUniqueFieldValues(allData, actualFieldName);
    return generateFieldListResponse(standardField, uniqueValues, lowerQuery);
  }
  
  if (lowerQuery.includes('how many') && lowerQuery.includes('per')) {
    // "How many devices per RDP?" or "How many per switch?"
    const distribution = analyzeFieldDistribution(allData, actualFieldName);
    return generateFieldDistributionResponse(standardField, distribution);
  }
  
  if (lowerQuery.includes('which') && (lowerQuery.includes('most') || lowerQuery.includes('highest'))) {
    // "Which RDP has the most devices?"
    const distribution = analyzeFieldDistribution(allData, actualFieldName);
    return generateTopFieldResponse(standardField, distribution);
  }
  
  if (lowerQuery.includes('more than') || lowerQuery.includes('greater than') || lowerQuery.includes('>')) {
    // "List RDPs with more than 5 devices"
    const threshold = extractNumberFromQuery(lowerQuery);
    if (threshold > 0) {
      const distribution = analyzeFieldDistribution(allData, actualFieldName);
      return generateFieldThresholdResponse(standardField, distribution, threshold, 'more than');
    }
  }
  
  if (lowerQuery.includes('less than') || lowerQuery.includes('<')) {
    // "List RDPs with less than 3 devices"
    const threshold = extractNumberFromQuery(lowerQuery);
    if (threshold > 0) {
      const distribution = analyzeFieldDistribution(allData, actualFieldName);
      return generateFieldThresholdResponse(standardField, distribution, threshold, 'less than');
    }
  }
  
  // Default: provide general field analysis
  const distribution = analyzeFieldDistribution(allData, actualFieldName);
  return generateGeneralFieldResponse(standardField, distribution);
}

function getAllSystemsData(systemData: any): any[] {
  const allData: any[] = [];
  
  // Combine data from all systems
  if (systemData.wifi?.rawData) allData.push(...systemData.wifi.rawData);
  if (systemData.tv?.rawData) allData.push(...systemData.tv.rawData);
  if (systemData.pbx?.rawData) allData.push(...systemData.pbx.rawData);
  if (systemData.cctv?.rawData) allData.push(...systemData.cctv.rawData);
  if (systemData.extracted?.rawData) allData.push(...systemData.extracted.rawData);
  if (systemData.cabinSwitch?.rawData) allData.push(...systemData.cabinSwitch.rawData);
  
  console.log(`Combined data from all systems: ${allData.length} total records`);
  return allData;
}

function generateFieldCountResponse(fieldName: string, uniqueValues: string[], totalRecords: number): string {
  return `## ${fieldName.toUpperCase()} Analysis\n\n` +
    `**Total unique ${fieldName}s:** ${uniqueValues.length}\n` +
    `**Total records analyzed:** ${totalRecords}\n\n` +
    `### Summary\n` +
    `Found **${uniqueValues.length}** different ${fieldName} values across ${totalRecords} records in the ship systems database.`;
}

function generateFieldListResponse(fieldName: string, uniqueValues: string[], query: string): string {
  const maxDisplay = 50;
  const displayValues = uniqueValues.slice(0, maxDisplay);
  const hasMore = uniqueValues.length > maxDisplay;
  
  let response = `## ${fieldName.toUpperCase()} List\n\n`;
  response += `**Total ${fieldName}s found:** ${uniqueValues.length}\n\n`;
  
  if (displayValues.length > 0) {
    response += `### ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} Values:\n\n`;
    response += `| ${fieldName.toUpperCase()} |\n|---|\n`;
    displayValues.forEach(value => {
      response += `| ${value} |\n`;
    });
    
    if (hasMore) {
      response += `\n*Showing first ${maxDisplay} of ${uniqueValues.length} total ${fieldName}s*`;
    }
  } else {
    response += `No ${fieldName} values found in the data.`;
  }
  
  return response;
}

function generateFieldDistributionResponse(fieldName: string, distribution: any): string {
  let response = `## Devices per ${fieldName.toUpperCase()}\n\n`;
  response += `**Total ${fieldName}s:** ${distribution.uniqueValues}\n`;
  response += `**Total devices:** ${distribution.totalRecords}\n`;
  response += `**Average devices per ${fieldName}:** ${(distribution.totalRecords / distribution.uniqueValues).toFixed(1)}\n\n`;
  
  response += `### Distribution:\n\n`;
  response += `| ${fieldName.toUpperCase()} | Device Count |\n|---|---|\n`;
  
  distribution.topValues.slice(0, 20).forEach((item: any) => {
    response += `| ${item.value} | ${item.count} |\n`;
  });
  
  if (distribution.distribution.length > 20) {
    response += `\n*Showing top 20 of ${distribution.distribution.length} total ${fieldName}s*`;
  }
  
  return response;
}

function generateTopFieldResponse(fieldName: string, distribution: any): string {
  const topItem = distribution.topValues[0];
  
  let response = `## Top ${fieldName.toUpperCase()} by Device Count\n\n`;
  
  if (topItem) {
    response += `**${fieldName.toUpperCase()} with most devices:** ${topItem.value} (${topItem.count} devices)\n\n`;
    
    response += `### Top 10 ${fieldName.toUpperCase()}s:\n\n`;
    response += `| Rank | ${fieldName.toUpperCase()} | Device Count |\n|---|---|---|\n`;
    
    distribution.topValues.slice(0, 10).forEach((item: any, index: number) => {
      response += `| ${index + 1} | ${item.value} | ${item.count} |\n`;
    });
  } else {
    response += `No ${fieldName} data found.`;
  }
  
  return response;
}

function generateFieldThresholdResponse(fieldName: string, distribution: any, threshold: number, comparison: string): string {
  const matchingItems = distribution.distribution.filter((item: any) => {
    if (comparison === 'more than') {
      return item.count > threshold;
    } else {
      return item.count < threshold;
    }
  });
  
  let response = `## ${fieldName.toUpperCase()}s with ${comparison} ${threshold} devices\n\n`;
  response += `**Found:** ${matchingItems.length} ${fieldName}s\n\n`;
  
  if (matchingItems.length > 0) {
    response += `### Results:\n\n`;
    response += `| ${fieldName.toUpperCase()} | Device Count |\n|---|---|\n`;
    
    matchingItems.slice(0, 50).forEach((item: any) => {
      response += `| ${item.value} | ${item.count} |\n`;
    });
    
    if (matchingItems.length > 50) {
      response += `\n*Showing first 50 of ${matchingItems.length} total results*`;
    }
  } else {
    response += `No ${fieldName}s found with ${comparison} ${threshold} devices.`;
  }
  
  return response;
}

function generateGeneralFieldResponse(fieldName: string, distribution: any): string {
  let response = `## ${fieldName.toUpperCase()} Analysis\n\n`;
  response += `**Total unique ${fieldName}s:** ${distribution.uniqueValues}\n`;
  response += `**Total records:** ${distribution.totalRecords}\n`;
  response += `**Average records per ${fieldName}:** ${(distribution.totalRecords / distribution.uniqueValues).toFixed(1)}\n\n`;
  
  if (distribution.topValues.length > 0) {
    response += `### Top ${fieldName.toUpperCase()}s:\n\n`;
    response += `| ${fieldName.toUpperCase()} | Count |\n|---|---|\n`;
    
    distribution.topValues.slice(0, 10).forEach((item: any) => {
      response += `| ${item.value} | ${item.count} |\n`;
    });
  }
  
  return response;
}

function extractNumberFromQuery(query: string): number {
  const lowerQuery = query.toLowerCase();
  
  // Word to number mapping
  const wordToNumber: { [key: string]: number } = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15
  };
  
  // Check for word numbers first
  for (const [word, num] of Object.entries(wordToNumber)) {
    if (lowerQuery.includes(word)) {
      console.log(`Extracted number from word: ${word} = ${num}`);
      return num;
    }
  }
  
  // Extract numeric values
  const numberMatch = query.match(/\b(\d+)\b/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1]);
    console.log(`Extracted number: ${number}`);
    return number;
  }
  
  console.log('No number found in query');
  return 0;
}

function handleCabinListingQuery(query: string, systemType: string, systemData: any, instructions?: string): string {
  const lowerQuery = query.toLowerCase();
  
  console.log(`🎯 === ENTERING handleCabinListingQuery ===`);
  console.log(`🎯 Query: ${query}`);
  console.log(`🎯 LowerQuery: ${lowerQuery}`);
  console.log(`🎯 Contains 'more than': ${lowerQuery.includes('more than')}`);
  console.log('Full systemData structure:', systemData);
  
  // Check if this is a "more than" query - if so, redirect to threshold logic
  if (lowerQuery.includes('more than')) {
    console.log(`🎯 >>> handleCabinListingQuery detected 'more than' query - redirecting to threshold logic`);
    // Extract the threshold number
    const numberMatch = lowerQuery.match(/more than (\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
    if (numberMatch) {
      const numberStr = numberMatch[1];
      const wordToNumber: { [key: string]: number } = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      const threshold = isNaN(parseInt(numberStr)) ? (wordToNumber[numberStr] || 0) : parseInt(numberStr);
      
      if (threshold > 0) {
        const cabinsWithMoreThan = getCabinsWithMoreThanThreshold(systemData.rawData, systemType, threshold);
        
        let response = `## ${systemType.toUpperCase()} System - Cabin List (More Than ${threshold})

`;
        if (instructions) response += `*Following instructions: ${instructions}*

`;
        
        response += `**ANSWER: Here are the ${cabinsWithMoreThan.length} cabins with more than ${threshold} ${getDeviceTypeName(systemType)}:**

`;
        
        if (cabinsWithMoreThan.length === 0) {
          response += `No cabins found with more than ${threshold} ${getDeviceTypeName(systemType)}.

`;
        } else {
          // Create table with cabin numbers
          response += `| Cabin Number | Device Count | Notes |
|-------------|--------------|-------|
`;
          
          // Show first 50 cabins to avoid overwhelming output
          const cabinsToShow = cabinsWithMoreThan.slice(0, 50);
          cabinsToShow.forEach((cabin: string, index: number) => {
            response += `| **${cabin}** | More than ${threshold} | Cabin ${index + 1} of ${cabinsWithMoreThan.length} |
`;
          });
          
          if (cabinsWithMoreThan.length > 50) {
            response += `
💡 **List Details:**
`;
            response += `- Total cabins found: ${cabinsWithMoreThan.length}
`;
            response += `- Each cabin has more than ${threshold} ${getDeviceTypeName(systemType)}
`;
            response += `- Results based on actual ${systemType.toUpperCase()} device assignments
`;
            response += `- Note: Large list truncated for readability
`;
          }
        }
        
        return response;
      }
    }
  }
  
  // Extract number and device type from query (for exact count queries)
  const numberMatch = lowerQuery.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
  if (numberMatch) {
    const numberStr = numberMatch[1];
    let targetCount = 0;
    
    // Convert word numbers to digits
    const wordToNumber: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    targetCount = isNaN(parseInt(numberStr)) ? (wordToNumber[numberStr] || 0) : parseInt(numberStr);
    
    if (targetCount > 0) {
      // Debug: Check data structure
      console.log('SystemData keys:', Object.keys(systemData));
      console.log('SystemData.rawData:', systemData.rawData);
      console.log('SystemData.data:', systemData.data);
      
      // The raw data is likely in systemData.rawData, but let's check all possibilities
      let dataToUse = null;
      if (systemData.rawData && Array.isArray(systemData.rawData)) {
        dataToUse = systemData.rawData;
        console.log('Using systemData.rawData, length:', dataToUse.length);
      } else if (systemData.data && Array.isArray(systemData.data)) {
        dataToUse = systemData.data;
        console.log('Using systemData.data, length:', dataToUse.length);
      } else if (Array.isArray(systemData)) {
        dataToUse = systemData;
        console.log('Using systemData directly, length:', dataToUse.length);
      } else {
        console.log('No valid array data found in systemData');
        return `No raw data available for ${systemType} system to perform cabin listing.`;
      }
      
      const cabinList = getCabinsWithExactDeviceCount(dataToUse, systemType, targetCount);
      
      let response = `## ${systemType.toUpperCase()} System - Cabin List\n\n`;
      if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
      
      response += `**ANSWER: Here are the ${cabinList.length} cabins with exactly ${targetCount} ${getDeviceTypeName(systemType)}:**\n\n`;
      
      if (cabinList.length > 0) {
        response += `| Cabin Number | Device Count | Notes |\n|-------|-------|-------|\n`;
        cabinList.forEach((cabin: string, index: number) => {
          response += `| **${cabin}** | ${targetCount} | Cabin ${index + 1} of ${cabinList.length} |\n`;
        });
        
        response += `\n💡 **List Details:**\n`;
        response += `- Total cabins found: ${cabinList.length}\n`;
        response += `- Each cabin has exactly ${targetCount} ${getDeviceTypeName(systemType)}\n`;
        response += `- Results based on actual ${systemType.toUpperCase()} device assignments\n`;
        
        if (cabinList.length > 20) {
          response += `- Note: Large list truncated for readability\n`;
        }
      } else {
        response += `No cabins found with exactly ${targetCount} ${getDeviceTypeName(systemType)}.\n`;
      }
      
      return response;
    }
  }
  
  // If we can't extract a number, provide a helpful error
  return `I couldn't find a specific number in your query "${query}". Please specify how many devices you're looking for (e.g., "list cabins with 5 phones").`;
}

// LLM-First Architecture Helper Functions
function extractCabinSystemsSummary(allSystemsData: any) {
  const summary: any = {};
  
  // Extract WiFi cabin data
  if (allSystemsData.systems?.wifi?.rawData) {
    const wifiData = allSystemsData.systems.wifi.rawData;
    const cabinCounts = new Map<string, number>();
    
    wifiData.forEach((device: any) => {
      const cabin = device.cabin || device.primary_cabin__rccl_;
      if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
        cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
      }
    });
    
    summary.wifi = {
      totalDevices: wifiData.length,
      totalCabins: cabinCounts.size,
      distribution: `${Array.from(cabinCounts.values()).filter(count => count === 1).length} cabins with 1 device, ${Array.from(cabinCounts.values()).filter(count => count > 1).length} cabins with 2+ devices`
    };
  }
  
  // Extract PBX cabin data
  if (allSystemsData.systems?.pbx?.rawData) {
    const pbxData = allSystemsData.systems.pbx.rawData;
    const cabinCounts = new Map<string, number>();
    
    pbxData.forEach((device: any) => {
      const cabin = device.cabin || device.primary_cabin__rccl_;
      if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
        cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
      }
    });
    
    summary.pbx = {
      totalDevices: pbxData.length,
      totalCabins: cabinCounts.size,
      distribution: `${Array.from(cabinCounts.values()).filter(count => count === 1).length} cabins with 1 device, ${Array.from(cabinCounts.values()).filter(count => count > 1).length} cabins with 2+ devices`
    };
  }
  
  // Extract TV cabin data
  if (allSystemsData.systems?.tv?.rawData) {
    const tvData = allSystemsData.systems.tv.rawData;
    const cabinCounts = new Map<string, number>();
    
    tvData.forEach((device: any) => {
      const cabin = device.cabin || device.primary_cabin__rccl_;
      if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
        cabinCounts.set(cabin, (cabinCounts.get(cabin) || 0) + 1);
      }
    });
    
    summary.tv = {
      totalDevices: tvData.length,
      totalCabins: cabinCounts.size,
      distribution: `${Array.from(cabinCounts.values()).filter(count => count === 1).length} cabins with 1 device, ${Array.from(cabinCounts.values()).filter(count => count > 1).length} cabins with 2+ devices`
    };
  }
  
  return summary;
}

function extractPublicSystemsSummary(allSystemsData: any) {
  const summary: any = {};
  
  // Extract public systems data (non-cabin)
  if (allSystemsData.systems?.extracted?.rawData) {
    const extractedData = allSystemsData.systems.extracted.rawData;
    summary.cctv = {
      totalDevices: extractedData.length,
      totalLocations: new Set(extractedData.map((d: any) => d.area || d.location)).size
    };
  }
  
  if (allSystemsData.systems?.cabinSwitch?.rawData) {
    const switchData = allSystemsData.systems.cabinSwitch.rawData;
    summary.switches = {
      totalDevices: switchData.length,
      totalLocations: new Set(switchData.map((d: any) => d.area || d.location)).size
    };
  }
  
  return summary;
}

function extractCombinedStats(allSystemsData: any) {
  let totalDevices = 0;
  let totalCabins = 0;
  let totalPublicLocations = 0;
  
  // Count all devices across all systems
  Object.values(allSystemsData.systems || {}).forEach((system: any) => {
    if (system?.rawData?.length) {
      totalDevices += system.rawData.length;
    }
  });
  
  // Count unique cabins
  const allCabins = new Set<string>();
  ['wifi', 'pbx', 'tv'].forEach(systemName => {
    const system = allSystemsData.systems?.[systemName];
    if (system?.rawData) {
      system.rawData.forEach((device: any) => {
        const cabin = device.cabin || device.primary_cabin__rccl_;
        if (cabin && cabin !== '-' && cabin !== '' && cabin !== 'undefined' && cabin !== 'null') {
          allCabins.add(cabin);
        }
      });
    }
  });
  
  totalCabins = allCabins.size;
  
  return {
    totalDevices,
    totalCabins,
    totalPublicLocations
  };
}

// LLM-First Architecture Functions
function buildLLMContext(allSystemsData: any, focusSystem?: string): string {
  console.log('🏗️ Building rich LLM context...');
  
  // Extract and structure data for both cabin and public systems
  const cabinData = extractCabinSystemsSummary(allSystemsData);
  const publicData = extractPublicSystemsSummary(allSystemsData);
  const combinedStats = extractCombinedStats(allSystemsData);
  
  let context = `You are analyzing ship systems data from Supabase databases. Here's the comprehensive data:

`;
  
  // Add cabin systems context
  context += `📱 CABIN SYSTEMS (Inside Cabins):
`;
  if (cabinData.wifi) {
    context += `• WiFi: ${cabinData.wifi.totalDevices} devices across ${cabinData.wifi.totalCabins} cabins\n`;
    context += `  - Distribution: ${cabinData.wifi.distribution}\n`;
  }
  if (cabinData.pbx) {
    context += `• PBX/Phones: ${cabinData.pbx.totalDevices} devices across ${cabinData.pbx.totalCabins} cabins\n`;
    context += `  - Distribution: ${cabinData.pbx.distribution}\n`;
  }
  if (cabinData.tv) {
    context += `• TV: ${cabinData.tv.totalDevices} devices across ${cabinData.tv.totalCabins} cabins\n`;
    context += `  - Distribution: ${cabinData.tv.distribution}\n`;
  }
  
  // Add public systems context
  context += `\n🏢 PUBLIC SYSTEMS (Common Areas):\n`;
  if (publicData.wifi) {
    context += `• WiFi: ${publicData.wifi.totalDevices} devices across ${publicData.wifi.totalLocations} locations\n`;
  }
  if (publicData.pbx) {
    context += `• PBX/Phones: ${publicData.pbx.totalDevices} devices across ${publicData.pbx.totalLocations} locations\n`;
  }
  if (publicData.cctv) {
    context += `• CCTV: ${publicData.cctv.totalDevices} devices across ${publicData.cctv.totalLocations} locations\n`;
  }
  
  // Add combined statistics
  context += `\n📊 COMBINED STATISTICS:\n`;
  context += `• Total Devices: ${combinedStats.totalDevices}\n`;
  context += `• Total Cabins: ${combinedStats.totalCabins}\n`;
  context += `• Total Public Locations: ${combinedStats.totalPublicLocations}\n`;
  
  if (focusSystem) {
    context += `\n🎯 FOCUS: User is asking specifically about ${focusSystem.toUpperCase()} system.\n`;
  }
  
  context += `\nPlease analyze this data naturally and provide helpful, conversational responses to user questions.\n`;
  
  return context;
}

async function naturalLanguageAnalysis(query: string, context: string, focusSystem?: string, instructions?: string): Promise<string> {
  console.log('🧠 Starting natural language analysis...');
  
  // For now, we'll use the existing analysis functions but with LLM-style reasoning
  // In a real implementation, this would call an actual LLM API
  
  const lowerQuery = query.toLowerCase();
  
  // Build a natural response based on the query intent
  let response = '';
  
  // Add instructions context if provided
  if (instructions) {
    response += `*${instructions}*\n\n`;
  }
  
  // Natural language intent detection (much simpler than rigid routing)
  if (lowerQuery.includes('total') || lowerQuery.includes('how many')) {
    response += await handleCountQuestions(query, context, focusSystem);
  } else if (lowerQuery.includes('list') || lowerQuery.includes('show me')) {
    response += await handleListQuestions(query, context, focusSystem);
  } else if (lowerQuery.includes('more than') || lowerQuery.includes('greater than')) {
    response += await handleThresholdQuestions(query, context, focusSystem);
  } else if (lowerQuery.includes('cabin') && lowerQuery.includes('public')) {
    response += await handleCombinedQuestions(query, context);
  } else {
    response += await handleGeneralQuestions(query, context, focusSystem);
  }

  return response;
}

// Simple Question Handler Functions (LLM-First Approach)
async function handleCountQuestions(query: string, context: string, focusSystem?: string): Promise<string> {
  console.log('🔢 Handling count question:', query);
  
  let response = `## Ship Systems Analysis - Count Query\n\n`;
  response += `**ANSWER: Based on the ship systems data:**\n\n`;
  response += `${context}\n\n`;
  response += `💡 **Natural Language Response:** I can see the data above and will provide a conversational answer based on your specific question: "${query}"\n\n`;
  
  if (focusSystem) {
    response += `🎯 **Focus:** Analyzing ${focusSystem.toUpperCase()} system specifically.\n`;
  }
  
  return response;
}

async function handleListQuestions(query: string, context: string, focusSystem?: string): Promise<string> {
  console.log('📋 Handling list question:', query);
  
  let response = `## Ship Systems Analysis - List Query\n\n`;
  response += `**ANSWER: Here's the information you requested:**\n\n`;
  response += `${context}\n\n`;
  response += `💡 **Natural Language Response:** Based on your question "${query}", I can analyze the data above and provide the specific list you're looking for.\n\n`;
  
  if (focusSystem) {
    response += `🎯 **Focus:** Listing from ${focusSystem.toUpperCase()} system data.\n`;
  }
  
  return response;
}

async function handleThresholdQuestions(query: string, context: string, focusSystem?: string): Promise<string> {
  console.log('📊 Handling threshold question:', query);
  
  let response = `## Ship Systems Analysis - Threshold Query\n\n`;
  response += `**ANSWER: Analyzing thresholds in the data:**\n\n`;
  response += `${context}\n\n`;
  response += `💡 **Natural Language Response:** For your threshold query "${query}", I can examine the distribution data above and identify items meeting your criteria.\n\n`;
  
  if (focusSystem) {
    response += `🎯 **Focus:** Threshold analysis for ${focusSystem.toUpperCase()} system.\n`;
  }
  
  return response;
}

async function handleCombinedQuestions(query: string, context: string): Promise<string> {
  console.log('🔄 Handling combined cabin+public question:', query);
  
  let response = `## Ship Systems Analysis - Combined Analysis\n\n`;
  response += `**ANSWER: Analyzing both cabin and public systems:**\n\n`;
  response += `${context}\n\n`;
  response += `💡 **Natural Language Response:** Your question "${query}" requires analysis of both cabin and public systems. I can combine the data above to provide comprehensive insights.\n\n`;
  
  return response;
}

async function handleGeneralQuestions(query: string, context: string, focusSystem?: string): Promise<string> {
  console.log('🤔 Handling general question:', query);
  
  let response = `## Ship Systems Analysis - General Query\n\n`;
  response += `**ANSWER: Here's my analysis of your question:**\n\n`;
  response += `${context}\n\n`;
  response += `💡 **Natural Language Response:** Based on your question "${query}", I can analyze the ship systems data above and provide relevant insights.\n\n`;
  
  if (focusSystem) {
    response += `🎯 **Focus:** General analysis of ${focusSystem.toUpperCase()} system.\n`;
  }
  
  return response;
}

async function queryClaude(message: string, allSystemsData: any, systemType?: string, instructions?: string) {
  try {
    console.log('🎯 === LLM-FIRST APPROACH ===');
    console.log('Query:', message);
    console.log('SystemType focus:', systemType);
    
    // Build rich, structured context for the LLM
    const context = buildLLMContext(allSystemsData, systemType);
    
    // Let the LLM reason naturally about the data
    const response = await naturalLanguageAnalysis(message, context, systemType, instructions);
    
    return response;
  } catch (error) {
    console.error('Error in LLM analysis:', error);
    return "I'm sorry, I'm having trouble analyzing the ship systems data right now. Please try again.";
  }
}

async function simulateEnhancedClaudeResponse(message: string, data: any, systemType?: string, instructions?: string) {
  console.log('Simulating Claude response with:', {
    messageLength: message.length,
    systemType: systemType || 'not specified',
    instructions: instructions || 'not provided'
  });
  
  const lowerMessage = message.toLowerCase();
  
  if (systemType) {
    const systemData = data.systems[systemType.toLowerCase()];
    if (!systemData) {
      const availableSystems = Object.keys(data.systems).join(', ');
      return `I couldn't find data for the "${systemType}" system. Available systems are: ${availableSystems}.`;
    }
    return generateSystemSpecificResponse(message, systemType, systemData, instructions);
  }
  
  function generateSystemSpecificResponse(query: string, systemType: string, systemData: any, instructions?: string): string {
    const lowerQuery = query.toLowerCase();
    const metrics = systemData.analysis || {};
    
    console.log(`=== generateSystemSpecificResponse called ===`);
    console.log(`Query: ${query}`);
    console.log(`SystemType: ${systemType}`);
    console.log(`LowerQuery: ${lowerQuery}`);
    console.log(`Contains 'list': ${lowerQuery.includes('list')}`);
    console.log(`Contains 'cabin': ${lowerQuery.includes('cabin')}`);
    console.log(`Contains 'more than': ${lowerQuery.includes('more than')}`);
    
    // Handle "list" queries for specific cabin numbers FIRST (before universal field analysis)
    // BUT exclude "more than" queries which should go to threshold logic
    const shouldRouteToCabinListing = lowerQuery.includes('list') && lowerQuery.includes('cabin') && !lowerQuery.includes('more than');
    console.log(`🎯 Should route to cabin listing: ${shouldRouteToCabinListing}`);
    
    if (shouldRouteToCabinListing) {
      console.log(`>>> Routing to cabin listing handler`);
      // This is a cabin listing query, handle it specifically
      return handleCabinListingQuery(query, systemType, systemData, instructions);
    }
    
    // Check if this is a "more than" query that should go to threshold logic
    if (lowerQuery.includes('more than') && lowerQuery.includes('cabin')) {
      console.log(`🎯 >>> Detected 'more than' query - routing to getCabinsWithMoreThanThreshold`);
      // Extract the threshold number
      const numberMatch = lowerQuery.match(/more than (\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
      if (numberMatch) {
        const numberStr = numberMatch[1];
        const wordToNumber: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        const threshold = isNaN(parseInt(numberStr)) ? (wordToNumber[numberStr] || 0) : parseInt(numberStr);
        
        if (threshold > 0) {
          const cabinsWithMoreThan = getCabinsWithMoreThanThreshold(systemData.rawData, systemType, threshold);
          
          let response = `## ${systemType.toUpperCase()} System - Cabin List (More Than ${threshold})\n\n`;
          if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
          
          response += `**ANSWER: Here are the ${cabinsWithMoreThan.length} cabins with more than ${threshold} ${getDeviceTypeName(systemType)}:**\n\n`;
          
          if (cabinsWithMoreThan.length === 0) {
            response += `No cabins found with more than ${threshold} ${getDeviceTypeName(systemType)}.\n\n`;
          } else {
            // Create table with cabin numbers
            response += `| Cabin Number | Device Count | Notes |\n|-------------|--------------|-------|\n`;
            
            // Show first 50 cabins to avoid overwhelming output
            const cabinsToShow = cabinsWithMoreThan.slice(0, 50);
            cabinsToShow.forEach((cabin: string, index: number) => {
              response += `| **${cabin}** | More than ${threshold} | Cabin ${index + 1} of ${cabinsWithMoreThan.length} |\n`;
            });
            
            if (cabinsWithMoreThan.length > 50) {
              response += `\n💡 **List Details:**\n`;
              response += `- Total cabins found: ${cabinsWithMoreThan.length}\n`;
              response += `- Each cabin has more than ${threshold} ${getDeviceTypeName(systemType)}\n`;
              response += `- Results based on actual ${systemType.toUpperCase()} device assignments\n`;
              response += `- Note: Large list truncated for readability\n`;
            }
          }
          
          return response;
        }
      }
    }
    
    // Universal Field Analysis - Handle any field-based queries (but not cabin listing)
    const detectedField = detectFieldInQuery(query);
    if (detectedField && detectedField.standardField !== 'cabin') {
      return handleUniversalFieldQuery(query, systemType, systemData, detectedField, instructions);
    }
    
    // Handle "list" queries for specific cabin numbers (but exclude "more than" queries)
    if (lowerQuery.includes('list') && lowerQuery.includes('cabin') && !lowerQuery.includes('more than')) {
      console.log(`🎯 >>> Second cabin listing code path - exact count queries only`);
      // Extract number and device type from query
      const numberMatch = lowerQuery.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
      if (numberMatch) {
        const numberStr = numberMatch[1];
        let targetCount = 0;
        
        // Convert word numbers to digits
        const wordToNumber: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        
        targetCount = isNaN(parseInt(numberStr)) ? (wordToNumber[numberStr] || 0) : parseInt(numberStr);
        
        if (targetCount > 0) {
          const cabinList = getCabinsWithExactDeviceCount(systemData.rawData, systemType, targetCount);
          
          let response = `## ${systemType.toUpperCase()} System - Cabin List\n\n`;
          if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
          
          response += `**ANSWER: Here are the ${cabinList.length} cabins with exactly ${targetCount} ${getDeviceTypeName(systemType)}:**\n\n`;
          
          if (cabinList.length > 0) {
            response += `| Cabin Number | Device Count | Notes |\n|-------|-------|-------|\n`;
            cabinList.forEach((cabin: string, index: number) => {
              response += `| **${cabin}** | ${targetCount} | Cabin ${index + 1} of ${cabinList.length} |\n`;
            });
            
            response += `\n💡 **List Details:**\n`;
            response += `- Total cabins found: ${cabinList.length}\n`;
            response += `- Each cabin has exactly ${targetCount} ${getDeviceTypeName(systemType)}\n`;
            response += `- Results based on actual ${systemType.toUpperCase()} device assignments\n`;
            
            if (cabinList.length > 20) {
              response += `- Note: Large list truncated for readability\n`;
            }
          } else {
            response += `No cabins found with exactly ${targetCount} ${getDeviceTypeName(systemType)}.\n`;
          }
          
          return response;
        }
      }
    }
    
    // Enhanced logical reasoning for specific questions
    if (lowerQuery.includes('crew') && lowerQuery.includes('cabin') && (lowerQuery.includes('2') || lowerQuery.includes('two'))) {
      if (systemType.toLowerCase() === 'pbx' && (lowerQuery.includes('phone') || lowerQuery.includes('pbx'))) {
        // Specific question: "how many crew cabins have 2 phones"
        const crewCabinsWithTwoPhones = analyzeCrewCabinsWithTwoDevices(systemData.rawData, 'phone');
        let response = `## PBX System Analysis - Crew Cabins with 2 Phones\n\n`;
        if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
        
        response += `**ANSWER: ${crewCabinsWithTwoPhones} crew cabins have exactly 2 phones**\n\n`;
        response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
        response += `| **Crew Cabins with 2 Phones** | ${crewCabinsWithTwoPhones} | **Direct answer to your question** |\n`;
        response += `| Total Crew Devices | ${metrics.crewDevices || 'N/A'} | All PBX devices in crew areas |\n`;
        response += `| Total Cabins with Phones | ${metrics.uniqueCabins || 'N/A'} | All cabins with PBX devices |\n`;
        response += `| Cabins with Multiple Phones | ${metrics.cabinsWithMultiplePhones || 'N/A'} | Cabins with 2+ phones |\n`;
        
        response += `\n💡 **Key Insights:**\n`;
        response += `- ${crewCabinsWithTwoPhones} crew cabins are equipped with exactly 2 phones\n`;
        response += `- This represents enhanced communication capability in crew areas\n`;
        response += `- Dual phone setup likely supports operational redundancy\n`;
        
        return response;
      }
      
      if (systemType.toLowerCase() === 'tv' && lowerQuery.includes('tv')) {
        const crewCabinsWithTwoTvs = analyzeCrewCabinsWithTwoDevices(systemData.rawData, 'tv');
        let response = `## TV System Analysis - Crew Cabins with 2 TVs\n\n`;
        if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
        
        response += `**ANSWER: ${crewCabinsWithTwoTvs} crew cabins have exactly 2 TVs**\n\n`;
        response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
        response += `| **Crew Cabins with 2 TVs** | ${crewCabinsWithTwoTvs} | **Direct answer to your question** |\n`;
        response += `| Total Crew Devices | ${metrics.crewDevices || 'N/A'} | All TV devices in crew areas |\n`;
        response += `| Cabins with 2 TVs | ${metrics.cabinsWithTwoTvs || 'N/A'} | All cabins with exactly 2 TVs |\n`;
        
        return response;
      }
    }
    
    // Handle general cabin distribution questions
    if (lowerQuery.includes('cabin')) {
      let response = `## ${systemType.toUpperCase()} System - Cabin Distribution Analysis\n\n`;
      if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
      
      // Handle "more than X" questions with dynamic number extraction
      if (lowerQuery.includes('more than')) {
        // Extract the number from the query
        const numberMatch = lowerQuery.match(/more than (\d+|one|two|three|four|five|six|seven|eight|nine|ten)/);
        if (numberMatch) {
          const numberStr = numberMatch[1];
          let threshold = 0;
          
          // Convert word numbers to digits
          const wordToNumber: { [key: string]: number } = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          
          threshold = isNaN(parseInt(numberStr)) ? (wordToNumber[numberStr] || 0) : parseInt(numberStr);
          
          if (threshold > 0) {
            const cabinsWithMoreThan = calculateCabinsWithMoreThan(systemData.rawData, systemType, threshold);
            
            response += `**ANSWER: ${cabinsWithMoreThan} cabins have more than ${threshold} ${getDeviceTypeName(systemType)}**\n\n`;
            response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
            response += `| **Cabins with More Than ${threshold} ${getDeviceTypeName(systemType)}** | ${cabinsWithMoreThan} | **Direct answer to your question** |\n`;
            
            // Add breakdown if available
            if (systemType.toLowerCase() === 'wifi') {
              response += `| Cabins with ${threshold + 1} WiFi devices | ${metrics.cabinsWithThreeWifi || 0} | |\n`;
              response += `| Cabins with ${threshold + 2}+ WiFi devices | ${metrics.cabinsWithFourOrMoreWifi || 0} | |\n`;
            } else if (systemType.toLowerCase() === 'tv') {
              response += `| Cabins with ${threshold + 1} TVs | ${metrics.cabinsWithThreeTvs || 0} | |\n`;
              response += `| Cabins with ${threshold + 2}+ TVs | ${metrics.cabinsWithFourOrMoreTvs || 0} | |\n`;
            } else if (systemType.toLowerCase() === 'pbx') {
              response += `| Cabins with ${threshold + 1} phones | ${metrics.cabinsWithThreePhones || 0} | |\n`;
              response += `| Cabins with ${threshold + 2}+ phones | ${metrics.cabinsWithFourOrMorePhones || 0} | |\n`;
            }
            
            response += `\n💡 **Analysis Details:**\n`;
            response += `- Analyzed all ${systemType.toUpperCase()} devices across ship cabins\n`;
            response += `- Counted cabins with device count > ${threshold}\n`;
            response += `- Results based on actual cabin assignments in the data\n`;
            
            return response;
          }
        }
      }
      
      // Handle "exactly X" questions
      if (lowerQuery.includes('2') || lowerQuery.includes('two')) {
        if (systemType.toLowerCase() === 'tv') {
          response += `**ANSWER: ${metrics.cabinsWithTwoTvs || 0} cabins have exactly 2 TVs**\n\n`;
          response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
          response += `| **Cabins with 2 TVs** | ${metrics.cabinsWithTwoTvs || 0} | **Direct answer to your question** |\n`;
          response += `| Cabins with 1 TV | ${metrics.cabinDistribution?.single || 0} | Single TV cabins |\n`;
          response += `| Cabins with 3 TVs | ${metrics.cabinsWithThreeTvs || 0} | Triple TV cabins |\n`;
          response += `| Cabins with 4+ TVs | ${metrics.cabinsWithFourOrMoreTvs || 0} | Multiple TV cabins |\n`;
        } else if (systemType.toLowerCase() === 'pbx') {
          response += `**ANSWER: ${metrics.cabinsWithTwoPhones || 0} cabins have exactly 2 phones**\n\n`;
          response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
          response += `| **Cabins with 2 Phones** | ${metrics.cabinsWithTwoPhones || 0} | **Direct answer to your question** |\n`;
          response += `| Cabins with 1 Phone | ${metrics.cabinDistribution?.single || 0} | Single phone cabins |\n`;
          response += `| Cabins with 3 Phones | ${metrics.cabinsWithThreePhones || 0} | Triple phone cabins |\n`;
          response += `| Cabins with 4+ Phones | ${metrics.cabinsWithFourOrMorePhones || 0} | Multiple phone cabins |\n`;
        } else if (systemType.toLowerCase() === 'wifi') {
          response += `**ANSWER: ${metrics.cabinsWithTwoWifi || 0} cabins have exactly 2 WiFi devices**\n\n`;
          response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
          response += `| **Cabins with 2 WiFi devices** | ${metrics.cabinsWithTwoWifi || 0} | **Direct answer to your question** |\n`;
          response += `| Cabins with 1 WiFi device | ${metrics.cabinDistribution?.single || 0} | Single WiFi cabins |\n`;
          response += `| Cabins with 3 WiFi devices | ${metrics.cabinsWithThreeWifi || 0} | Triple WiFi cabins |\n`;
          response += `| Cabins with 4+ WiFi devices | ${metrics.cabinsWithFourOrMoreWifi || 0} | Multiple WiFi cabins |\n`;
        }
        return response;
      }
    }
    
    // Default system analysis
    let response = `## ${systemType.toUpperCase()} System Analysis\n\n`;
    if (instructions) response += `*Following instructions: ${instructions}*\n\n`;
    
    response += `| Metric | Value | Notes |\n|-------|-------|-------|\n`;
    
    // Handle CCTV system specifically
    if (systemType.toLowerCase() === 'cctv') {
      response += `| **Total Cable IDs** | ${metrics.totalCables || metrics.totalDevices || 'N/A'} | **Total CCTV cables in system** |\n`;
      response += `| **Crew Area Cable IDs** | ${metrics.crewCables || metrics.crewDevices || 'N/A'} | **CCTV cables in crew areas** |\n`;
      response += `| **Passenger Area Cable IDs** | ${metrics.passengerCables || metrics.passengerDevices || 'N/A'} | CCTV cables in passenger areas |\n`;
      response += `| Crew Coverage | ${metrics.crewPercentage || metrics.coverageRate || 'N/A'}% | Percentage of cables in crew areas |\n`;
      response += `| System Types | ${metrics.systemTypes?.length || 'N/A'} | Different CCTV system types |\n`;
      response += `| Unique Locations | ${metrics.uniqueLocations || 'N/A'} | Coverage areas |\n`;
      if (metrics.uniqueCabins) {
        response += `| **Total Cabins** | ${metrics.uniqueCabins} | Cabins with CCTV coverage |\n`;
      }
    } else {
      // Handle other systems
      if (query.toLowerCase().includes('cabin')) {
        response += `| **Total Cabins** | ${metrics.uniqueCabins || 'N/A'} | Direct answer to your cabin question |\n`;
      }
      if (query.toLowerCase().includes('device')) {
        response += `| **Total Devices** | ${metrics.totalDevices || 'N/A'} | **Highlighted as key metric** |\n`;
      }
      response += `| Coverage Rate | ${metrics.coverageRate || metrics.onlinePercentage || 'N/A'}% | System health indicator |\n`;
    }
    
    response += `| Crew Devices | ${metrics.crewDevices || 'N/A'} | For crew areas |\n`;
    response += `| Passenger Devices | ${metrics.passengerDevices || 'N/A'} | For passenger areas |\n`;
    
    if (systemData.technicalSpecs) {
      response += `\n### Technical Specifications\n\n`;
      for (const [key, value] of Object.entries(systemData.technicalSpecs)) {
        response += `- **${key}**: ${value}\n`;
      }
    }
    
    // Add system-specific insights
    response += `\n💡 Insights and Recommendations\n\n`;
    if (systemType.toLowerCase() === 'cctv') {
      response += `- CCTV system has ${metrics.totalCables || 0} total field cables\n`;
      response += `- Installation coverage: ${metrics.installationPercentage || 0}%\n`;
      response += `- Monitor cable installation progress regularly\n`;
    } else {
      response += `- Ensure system coverage is optimal\n`;
      response += `- Monitor device status regularly\n`;
    }
    
    return response;
  }
  
  if (lowerMessage.includes('cabin')) {
    const totalCabins = data.crossSystem?.totalUniqueCabins || 0;
    const systems = data.systems as Record<string, { analysis?: { uniqueCabins?: number } }>;
    
    const cabinsBySystem = Object.entries(systems)
      .map(([name, sys]) => {
        return `- ${name.charAt(0).toUpperCase() + name.slice(1)}: ${sys.analysis?.uniqueCabins || 0} cabins`;
      })
      .join('\n');
    
    return `🏠 Cross-System Cabin Analysis\n\nBased on comprehensive analysis across all ship systems:\n\n• Total Unique Cabins: ${totalCabins}\n\n📊 Cabins by System:\n${cabinsBySystem}\n\n💡 Insights:\n- Cross-system cabin coverage provides comprehensive service\n- Each system serves different cabin needs (WiFi, phones, TV, etc.)\n- Total unique cabins represent complete ship accommodation`;
  }
  
  if (lowerMessage.includes('device') || lowerMessage.includes('equipment')) {
    const totalDevices = data.crossSystem?.totalDevices || 0;
    const onlineDevices = data.crossSystem?.totalOnline || 0;
    const offlineDevices = data.crossSystem?.totalOffline || 0;
    const onlineRate = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;
    
    const systems = data.systems as Record<string, { analysis?: { totalDevices?: number } }>;
    
    let maxDeviceSystem = '';
    let maxDevices = 0;
    Object.entries(systems).forEach(([name, system]) => {
      const deviceCount = system?.analysis?.totalDevices || 0;
      if (deviceCount > maxDevices) {
        maxDevices = deviceCount;
        maxDeviceSystem = name;
      }
    });
    
    const devicesBySystem = Object.entries(systems)
      .filter(([_, sys]) => sys?.analysis?.totalDevices)
      .map(([name, sys]) => {
        return `- ${name.charAt(0).toUpperCase() + name.slice(1)}: ${sys.analysis?.totalDevices} devices`;
      })
      .join('\n');
    
    return `📱 Cross-System Device Analysis\n\nBased on comprehensive analysis across all ship systems:\n\n• Total Devices: ${totalDevices}\n• Online Devices: ${onlineDevices} (${onlineRate}%)\n• Offline Devices: ${offlineDevices} (${100 - onlineRate}%)\n\n📊 Devices by System:\n${devicesBySystem}\n\n💡 Insights:\n- Overall system health is ${onlineRate >= 85 ? 'excellent' : onlineRate >= 70 ? 'good' : 'needs attention'}\n- ${onlineRate}% of all devices are currently online and operational\n- ${maxDeviceSystem.charAt(0).toUpperCase() + maxDeviceSystem.slice(1)} system has the most devices\n\n🔧 Recommendations:\n- ${offlineDevices > 0 ? `Investigate ${offlineDevices} offline devices` : 'Maintain current excellent uptime'}\n- Regular monitoring of device health across all systems`;
  }
  
  return `I've analyzed the ship systems data based on your question: "${message}"\n\nTo get more specific insights, you can:\n1. Ask about a specific system (like "Tell me about the WiFi system")\n2. Ask about specific metrics (like "How many devices are online?")\n3. Request technical details (like "Show me technical specs for all systems")\n\nI'm here to help with any ship systems analysis you need!`;
}
