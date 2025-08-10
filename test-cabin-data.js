// Test script to directly query the three cabin databases
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (you'll need to add your credentials)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCabinDatabases() {
  console.log('🔍 TESTING CABIN DATABASES DIRECTLY...\n');
  
  try {
    // Test PBX table
    console.log('📞 TESTING PBX TABLE (wgc_databasewgc_database_pbx):');
    const { data: pbxData, error: pbxError } = await supabase
      .from('wgc_databasewgc_database_pbx')
      .select('*')
      .limit(5);
    
    if (pbxError) {
      console.error('PBX Error:', pbxError);
    } else {
      console.log(`Records found: ${pbxData?.length || 0}`);
      if (pbxData && pbxData.length > 0) {
        console.log('First PBX record:', JSON.stringify(pbxData[0], null, 2));
        console.log('PBX Cable IDs:', pbxData.map(r => r.cable_id).slice(0, 5));
      }
    }
    
    console.log('\n📺 TESTING TV TABLE (wgc_databasewgc_database_tv):');
    const { data: tvData, error: tvError } = await supabase
      .from('wgc_databasewgc_database_tv')
      .select('*')
      .limit(5);
    
    if (tvError) {
      console.error('TV Error:', tvError);
    } else {
      console.log(`Records found: ${tvData?.length || 0}`);
      if (tvData && tvData.length > 0) {
        console.log('First TV record:', JSON.stringify(tvData[0], null, 2));
        console.log('TV Cable IDs:', tvData.map(r => r.cable_id).slice(0, 5));
      }
    }
    
    console.log('\n📶 TESTING WIFI TABLE (wgc_databasewgc_database_wifi):');
    const { data: wifiData, error: wifiError } = await supabase
      .from('wgc_databasewgc_database_wifi')
      .select('*')
      .limit(5);
    
    if (wifiError) {
      console.error('WiFi Error:', wifiError);
    } else {
      console.log(`Records found: ${wifiData?.length || 0}`);
      if (wifiData && wifiData.length > 0) {
        console.log('First WiFi record:', JSON.stringify(wifiData[0], null, 2));
        console.log('WiFi Cable IDs:', wifiData.map(r => r.cable_id).slice(0, 5));
      }
    }
    
    console.log('\n🔍 COMPARING WITH PUBLIC CABLE LIST:');
    const { data: publicData, error: publicError } = await supabase
      .from('wgc_databasewgc_database_field_cables')
      .select('*')
      .limit(5);
    
    if (publicError) {
      console.error('Public Cable Error:', publicError);
    } else {
      console.log(`Public Cable Records found: ${publicData?.length || 0}`);
      if (publicData && publicData.length > 0) {
        console.log('First Public Cable record:', JSON.stringify(publicData[0], null, 2));
        console.log('Public Cable IDs:', publicData.map(r => r.cable_id).slice(0, 5));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCabinDatabases();
