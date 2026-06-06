export { auth as proxy } from "@/auth"

export const config = {
  matcher: ["/dashboard/:path*", "/compose/:path*", "/search/:path*", "/settings/:path*"],
}
