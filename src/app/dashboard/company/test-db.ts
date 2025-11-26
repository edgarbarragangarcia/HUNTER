'use server'

import { createClient } from "@/lib/supabase/server";

export async function testDatabaseConnection() {
    const supabase = await createClient();

    // Test 1: Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth test:", { user: user?.id, error: authError });

    // Test 2: Check table exists and can query
    const { data: docs, error: queryError } = await supabase
        .from('company_documents')
        .select('*')
        .limit(1);

    console.log("Table test:", { docs, error: queryError });

    return {
        authenticated: !!user,
        userId: user?.id,
        tableAccessible: !queryError,
        error: queryError?.message || authError?.message
    };
}
