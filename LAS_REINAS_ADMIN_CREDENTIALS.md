# 🔐 Las Reinas Admin Credentials

## Admin Login

**URL**: https://lasreinas.alessacloud.com/admin/login

**Credentials**:
```
Email:    admin@lapoblanita.com
Password: LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX
```

**Note**: Currently, all tenant admins use the same shared credentials from VPS `.env` file:
- `ADMIN_EMAIL=admin@lapoblanita.com`
- `ADMIN_PASSWORD="LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX"`

---

## Super Admin (can access tenant admin on subdomain)

**URL**: https://lasreinas.alessacloud.com/admin/login

**Credentials**:
```
Email:    super@alessacloud.com
Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
```

**Note**: Super admins can now access tenant admin when logging in on tenant subdomain!

---

## 🧪 Test Locally

**URL**: http://localhost:3001/admin/login
**Email**: admin@lapoblanita.com
**Password**: Check `.env` file or use VPS password above

