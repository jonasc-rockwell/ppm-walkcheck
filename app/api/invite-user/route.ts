import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

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
      return NextResponse.json({ error: 'Server environment missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { email, role, fullName, company, assignedCategories } = await request.json();

    const tempPassword = generateTempPassword();

    // 1. Create account in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 2. Insert profile record
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

    // 3. Assign categories if Contractor
    if (role === 'contractor' && Array.isArray(assignedCategories) && assignedCategories.length > 0) {
      const categoryRows = assignedCategories.map((catName: string) => ({
        user_id: userId,
        category_name: catName,
      }));

      const { error: categoryError } = await supabaseAdmin
        .from('contractor_category_assignments')
        .insert(categoryRows);

      if (categoryError) throw categoryError;
    }

    return NextResponse.json({
      success: true,
      userId,
      tempPassword,
      message: `Account created successfully. Temporary Password: ${tempPassword}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}