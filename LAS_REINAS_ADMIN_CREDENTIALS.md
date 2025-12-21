# Las Reinas Admin Credentials

## Admin Login

**URL**: https://lasreinas.alessacloud.com/admin/login
**Alt URL**: https://lasreinascolusa.com/admin/login

### Option 1 - Las Reinas Tenant Admin (RECOMMENDED)
```
Email:    admin@lasreinas.com
Password: LasReinas2024!
```

### Option 2 - Super Admin
```
Email:    super@alessacloud.com
Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
```

### Option 3 - Legacy Admin (backwards compatible)
```
Email:    admin@lasreinas.com
Password: LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX
```

---

## VPS Environment Variables

```bash
# Tenant-specific (Las Reinas)
TENANT_ADMIN_LASREINAS_EMAIL=admin@lasreinas.com
TENANT_ADMIN_LASREINAS_PASSWORD="LasReinas2024!"

# Legacy (now uses Las Reinas branding)
ADMIN_EMAIL=admin@lasreinas.com
ADMIN_PASSWORD="LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX"

# Super Admin
SUPER_ADMIN_EMAIL=super@alessacloud.com
SUPER_ADMIN_PASSWORD="TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E"
```

---

## Quick Test

```bash
# Test login
curl -X POST https://lasreinas.alessacloud.com/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lasreinas.com","password":"LasReinas2024!"}'
```

---

*Updated: December 20, 2025*
*All La Poblanita references removed from Las Reinas admin config*
