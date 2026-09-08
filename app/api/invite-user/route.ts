import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize admin client with Service Role Key to manage users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, fullName, role, company, assignedEquipmentIds } = await req.json();

    // 1. Send automated invitation email to set password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Insert user profile with updated roles ('root', 'rlc', 'contractor')
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      full_name: fullName,
      role: role, // 'root', 'rlc', or 'contractor'
      company: company,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Assign equipment if user is a contractor
    if (role === 'contractor' && assignedEquipmentIds?.length > 0) {
      const assignments = assignedEquipmentIds.map((eqId: number) => ({
        user_id: authData.user.id,
        equipment_id: eqId,
      }));
      
      await supabaseAdmin.from('contractor_assignments').insert(assignments);
    }

    return NextResponse.json({ success: true, message: 'Invite sent successfully!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}