import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Helper to generate a random temporary password
function generateTempPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { email, role, fullName, company, assignedEquipment } = await request.json();

    const tempPassword = generateTempPassword();

    // 1. Create the user with the generated temporary password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Pre-confirm email so they can log in directly with the temp password
      user_metadata: { must_change_password: true },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Create profile entry with must_change_password flag
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role,
        company,
        must_change_password: true,
      });

    if (profileError) throw profileError;

    // 3. Assign equipment if contractor
    if (role === 'contractor' && Array.isArray(assignedEquipment) && assignedEquipment.length > 0) {
      const assignments = assignedEquipment.map((eqId: number) => ({
        user_id: userId,
        equipment_id: eqId,
      }));
      await supabaseAdmin.from('contractor_assignments').insert(assignments);
    }

    // 4. Send custom password email via Supabase Auth reset trigger OR return credentials to Admin
    // Trigger password reset / magic invitation link email
    const { error: resetEmailError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://ppm-walkcheck.vercel.app/reset-password',
      },
    });

    if (resetEmailError) console.warn('Recovery link generation warning:', resetEmailError.message);

    return NextResponse.json({
      success: true,
      userId,
      tempPassword, // Return so Root Admin can view/copy it if needed
      message: `User created. Temporary password: ${tempPassword}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}