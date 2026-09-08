import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.clone();

  // 1. If trying to access protected paths without login, redirect to login
  const isProtectedPath = url.pathname.startsWith('/root') || 
                          url.pathname.startsWith('/rlc') || 
                          url.pathname.startsWith('/contractor');

  if (isProtectedPath && !user) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Role-based routing checks
  if (user && isProtectedPath) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    // Block contractors from root & RLC areas
    if (role === 'contractor' && (url.pathname.startsWith('/root') || url.pathname.startsWith('/rlc'))) {
      url.pathname = '/contractor';
      return NextResponse.redirect(url);
    }

    // Block RLC supervisors from root administrative panel
    if (role === 'rlc' && url.pathname.startsWith('/root')) {
      url.pathname = '/rlc';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/root/:path*', '/rlc/:path*', '/contractor/:path*'],
};