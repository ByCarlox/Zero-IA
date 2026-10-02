# Guía de Despliegue de Bajo Costo (Zero-to-Low Cost Blueprint)

Esta guía, diseñada por el **Líder de Despliegue & DevOps (`devops-lead`)** y aprobada por la **Gerencia General**, detalla el procedimiento maestro para desplegar la plataforma **Kriterion** en internet con disponibilidad global, certificado SSL automático y costo operativo de **$0 USD / mes**.

---

## 1. Arquitectura de Despliegue Óptima: Cloudflare Pages

Dado que **Kriterion** funciona íntegramente en cliente (*Client-Side Processing* mediante JavaScript y Web Workers), no requiere servidores backend con cómputo pesado en la nube. 

### Ventajas de Cloudflare Pages:
- **Costo:** $0.00 / mes (Capa gratuita generosa de por vida).
- **Ancho de banda:** Ilimitado.
- **Red de distribución (CDN):** Servido desde más de 300 ciudades en el mundo con latencia ultrabaja (< 20ms).
- **Seguridad:** Certificado SSL/TLS automático gratuito, mitigación DDoS ilimitada y soporte para cabeceras HTTP de seguridad a través del archivo `_headers`.
- **Dominio personalizado:** Conexión gratuita con dominio propio (ej. `kriterion.io`, `kriterion.app`, `kriterion.org`).

---

## 2. Métodos de Publicación

### Opción A: Despliegue Directo sin Git (Arrastrar y Soltar)
1. Ejecuta el script de empaquetado:
   ```bash
   python3 tools/build_site.py
   ```
2. Esto creará la carpeta:
   `dist/Kriterion-3.2.0`
3. Ingresa a tu panel de **Cloudflare Dashboard** (`dash.cloudflare.com`) $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Upload assets**.
4. Arrastra la carpeta `dist/Kriterion-3.2.0` y presiona **Deploy**.
5. ¡Listo! Tu plataforma estará disponible al instante en una URL del tipo `https://kriterion.pages.dev`.

---

### Opción B: Despliegue Continuo (CI/CD Automático con GitHub)
1. Conecta tu repositorio de GitHub a Cloudflare Pages.
2. Configura los siguientes parámetros de compilación en el asistente de Cloudflare:
   - **Framework preset:** `None`
   - **Build command:** `python3 tools/build_site.py`
   - **Build output directory:** `dist/Kriterion-3.2.0`
3. Cada vez que hagas un `git push` a la rama `main`, Cloudflare Pages compilará la distribución y la publicará en producción en segundos.

---

### Opción C: GitHub Pages (Alternativa Gratuita)
1. En GitHub, ve a **Settings** $\rightarrow$ **Pages**.
2. En **Build and deployment**, selecciona la fuente **GitHub Actions**.
3. El pipeline automatizado `.github/workflows/deploy.yml` compilará y publicará la web estática en tu subdominio `github.io` o tu dominio personalizado con SSL gratuito.

---

## 3. Seguridad Perimetral Implementada

El repositorio incluye el archivo `_headers` que Cloudflare Pages aplica automáticamente a todas las respuestas:

- **Content-Security-Policy (CSP):** Restringe las fuentes de scripts exclusivamente a scripts locales y CDNs auditadas (cdnjs, Google Fonts).
- **X-Frame-Options: SAMEORIGIN:** Previene ataques de clickjacking.
- **X-Content-Type-Options: nosniff:** Previene ataques de confusión de tipos MIME.
- **Referrer-Policy: strict-origin-when-cross-origin:** Salvaguarda la privacidad en enlaces salientes.
- **Permissions-Policy:** Desactiva accesos no utilizados (cámara, micrófono, geolocalización) para tranquilidad absoluta del usuario.

---

## 4. Estimación de Costos a Escala

| Métrica | 1,000 visitas/mes | 100,000 visitas/mes | 1,000,000 visitas/mes |
| :--- | :--- | :--- | :--- |
| **Alojamiento Cloudflare Pages** | $0.00 | $0.00 | $0.00 |
| **Certificado SSL / HTTPS** | $0.00 | $0.00 | $0.00 |
| **Tráfico / Transferencia** | $0.00 | $0.00 | $0.00 |
| **Dominio Propio (Opcional)** | ~$10 - $12 / año | ~$10 - $12 / año | ~$10 - $12 / año |
| **Costo Total Mensual** | **$0.00 / mes** | **$0.00 / mes** | **$0.00 / mes** |
