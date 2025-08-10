const { createClient } = require('@supabase/supabase-js');

// Test script to check DK values in the three cabin tables
async function testDKValues() {
  try {
    // You'll need to add your Supabase credentials here
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔥 Testing DK values in cabin tables...\n');
    
    // Test PBX table
    console.log('📊 PBX Table (wgc_databasewgc_database_pbx):');
    const { data: pbxData, error: pbxError } = await supabase
      .from('wgc_databasewgc_database_pbx')
      .select('dk, cable_id, inside_cabin')
      .eq('inside_cabin', 'yes')
      .range(0, 99999);
    
    if (pbxError) {
      console.error('PBX Error:', pbxError);
    } else {
      const pbxDKs = pbxData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
      console.log(`- Records: ${pbxData.length}`);
      console.log(`- DK Range: ${Math.min(...pbxDKs)} to ${Math.max(...pbxDKs)}`);
      console.log(`- Unique DKs: ${[...new Set(pbxDKs)].sort((a,b) => a-b).slice(0, 20).join(', ')}`);
      console.log(`- Sample records:`, pbxData.slice(0, 5).map(r => ({ cable_id: r.cable_id, dk: r.dk })));
    }
    
    console.log('\n📊 TV Table (wgc_databasewgc_database_tv):');
    const { data: tvData, error: tvError } = await supabase
      .from('wgc_databasewgc_database_tv')
      .select('dk, cable_id, inside_cabin')
      .eq('inside_cabin', 'yes')
      .range(0, 99999);
    
    if (tvError) {
      console.error('TV Error:', tvError);
    } else {
      const tvDKs = tvData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
      console.log(`- Records: ${tvData.length}`);
      console.log(`- DK Range: ${Math.min(...tvDKs)} to ${Math.max(...tvDKs)}`);
      console.log(`- Unique DKs: ${[...new Set(tvDKs)].sort((a,b) => a-b).slice(0, 20).join(', ')}`);
      console.log(`- Sample records:`, tvData.slice(0, 5).map(r => ({ cable_id: r.cable_id, dk: r.dk })));
    }
    
    console.log('\n📊 WiFi Table (wgc_databasewgc_database_wifi):');
    const { data: wifiData, error: wifiError } = await supabase
      .from('wgc_databasewgc_database_wifi')
      .select('dk, cable_id, inside_cabin')
      .eq('inside_cabin', 'yes')
      .range(0, 99999);
    
    if (wifiError) {
      console.error('WiFi Error:', wifiError);
    } else {
      const wifiDKs = wifiData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
      console.log(`- Records: ${wifiData.length}`);
      console.log(`- DK Range: ${Math.min(...wifiDKs)} to ${Math.max(...wifiDKs)}`);
      console.log(`- Unique DKs: ${[...new Set(wifiDKs)].sort((a,b) => a-b).slice(0, 20).join(', ')}`);
      console.log(`- Sample records:`, wifiData.slice(0, 5).map(r => ({ cable_id: r.cable_id, dk: r.dk })));
    }
    
    // Combined analysis
    const allData = [...(pbxData || []), ...(tvData || []), ...(wifiData || [])];
    const allDKs = allData.map(r => parseInt(r.dk) || 0).filter(n => !isNaN(n));
    
    console.log('\n🔥 COMBINED ANALYSIS:');
    console.log(`- Total Records: ${allData.length}`);
    console.log(`- DK Range: ${Math.min(...allDKs)} to ${Math.max(...allDKs)}`);
    console.log(`- All Unique DKs: ${[...new Set(allDKs)].sort((a,b) => a-b).join(', ')}`);
    console.log(`- Records with DK >= 10: ${allData.filter(r => parseInt(r.dk) >= 10).length}`);
    
    // Check for DK = 10 specifically
    const dk10Records = allData.filter(r => r.dk === '10' || r.dk === 10);
    console.log(`- Records with DK = 10: ${dk10Records.length}`);
    if (dk10Records.length > 0) {
      console.log(`- DK=10 Sample:`, dk10Records.slice(0, 3).map(r => ({ cable_id: r.cable_id, dk: r.dk, table: r.source_table })));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDKValues();
