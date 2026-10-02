# Equipo Multiagente Integral de Desarrollo, Negocio y Lanzamiento Web

Este documento define la estructura directiva, los departamentos operativos, los roles especializados y el flujo de trabajo del equipo multiagente para la reestructuración completa de branding, desarrollo, calidad, experiencia, optimización, legal, ventas, despliegue y diseño de la plataforma.

---

## 1. Organigrama General y Flujo de Trabajo

```mermaid
flowchart TD
    User([Usuario / Stakeholder]) --> CEO["👔 Gerente General & Orquestador Ejecutivo (general-manager)"]
    
    subgraph DivisionNegocio["División de Negocio & Crecimiento"]
        Ventas["💼 Equipo de Ventas & Mercado (sales-lead)"]
        Mkt["📢 Equipo de Marketing & Rebranding (marketing-lead)"]
    end

    subgraph DivisionCreativa["División Creativa & Experiencia"]
        Diseno["🎨 Equipo de Diseño & Branding (brand-design-lead)"]
        UX["✨ Experiencia de Usuario (ux-lead)"]
    end

    subgraph DivisionTecnica["División de Ingeniería & Rendimiento"]
        Dev["💻 Programación & Depuración (code-lead)"]
        Opt["⚡ Optimización & Rendimiento (performance-lead)"]
        DevOps["🚀 Equipo de Despliegue Low-Cost (devops-lead)"]
    end

    subgraph DivisionGobernanza["División de Calidad & Legal"]
        QA["🧪 Control de Calidad Integral (qa-lead)"]
        Legal["⚖️ Equipo Legal & Cumplimiento (legal-lead)"]
    end

    CEO --> DivisionNegocio
    CEO --> DivisionCreativa
    CEO --> DivisionTecnica
    CEO --> DivisionGobernanza

    Ventas -->|Insights de Mercado & Dolor Real| Mkt
    Mkt -->|Narrativa, Rebranding & SEO| Diseno
    Diseno -->|Identidad Visual & Sistema de Diseño| UX
    UX -->|Prototipos & Flujos de Usuario| Dev
    Legal -->|Términos, Privacidad & Cumplimiento| Dev
    Dev -->|Código Limpio & Depurado| Opt
    Opt -->|Plataforma Rápida & Responsiva| QA
    QA -->|Certificación de Cero Fallos| DevOps
    DevOps -->|Plan & Entorno de Despliegue| CEO
    CEO --> Output([Producto Líder, Escalable y Listo para Internet])
```

---

## 2. Liderazgo Ejecutivo

### 👔 Gerente General & Orquestador Ejecutivo (`general-manager`)
- **Rol:** Chief Executive Officer (CEO) & Product Architect.
- **Misión:** Liderar, organizar y alinear estratégicamente a todos los equipos; auditar entregables, remover cuellos de botella y definir la hoja de ruta integral.
- **Responsabilidades clave:**
  - Definir las necesidades operativas de cada área y autorizar la asignación de especialistas/trabajadores requeridos.
  - Asegurar coherencia total entre el modelo de negocio, el marco legal, la experiencia de usuario y la excelencia técnica.
  - Dictaminar los criterios de calidad y control de riesgos para autorizar cada fase.
  - Gestionar la transición de la plataforma desde su estado actual hasta su nuevo branding y despliegue global.

### 💎 Core Values No Negociables del Gerente General
1. **Excelencia Obsesiva:** No se aceptan entregables "a medias", parches temporales ni soluciones mediocres. Si una pantalla, módulo de código o copy no alcanza el estándar más alto de la industria, **se veta y se manda a rehacer de inmediato**.
2. **Propiedad Intelectual y Cero Plagio:** Tolerancia cero con el copiado de repositorios ajenos, componentes prediseñados de terceros o textos calcados. Toda la solución debe ser desarrollada a medida, original y jurídicamente inexpugnable.
3. **Privacidad y Ética como Estandarte:** El procesamiento en cliente (*Client-Side Processing*) no se negocia: los documentos de los usuarios nunca se guardan, no van a servidores oscuros ni entrenan modelos de terceros.
4. **Velocidad y Cero Fricción:** Experiencia instantánea, sin esperas innecesarias ni desbordamientos visuales en móviles o desktop.
5. **Fiabilidad Absoluta:** Cero excepciones no controladas en consola, 100% de tests unitarios pasando y total consistencia en las revisiones.

---

## 2.1. Dictamen Conjunto: Gerencia General & Asesoría Legal (`legal-lead`)
### Política Estricta de Originalidad, Inspiración Ética y Cero Plagio

Tras una sesión de deliberación estratégica entre el **Gerente General** y el **Líder Legal**, se establece el siguiente marco jurídico y ético de cumplimiento obligatorio para todos los departamentos:

| Dimensión | Práctica Permitida (Inspiración Ética) | Práctica Estrictamente Prohibida (Plagio / Infracción) |
| :--- | :--- | :--- |
| **Código y Arquitectura** | Analizar patrones arquitectónicos abiertos de la industria y estándares W3C/ECMAScript para implementar código 100% propio y artesanal. | Clonar, copiar o extraer código de repositorios ajenos (GitHub, StackOverflow o plataformas de la competencia) sin atribución o violando licencias. |
| **Diseño y UI/UX** | Tomar referencias conceptuales de cómo las mejores herramientas resuelven la visualización de datos o flujos de carga para crear un estilo original. | Copiar paletas de colores idénticas, calcar layouts, duplicar estructuras CSS o imitar el *trade dress* (imagen comercial distintiva) de competidores. |
| **Logotipo y Marca** | Analizar tendencias visuales de confianza académica y modernidad tecnológica para crear un isotipo y tipografía vectoriales únicos. | Usar isotipos similares a logos de terceros, iconografía con copyright o nombres que puedan generar confusión marcaria (*trademark infringement*). |
| **Copywriting y Contenidos** | Entender los dolores del estudiante (miedo al plagio involuntario, falsos positivos de IA) para redactar mensajes empáticos originales. | Copiar párrafos, eslóganes, términos legales o estructuras de texto de sitios como Turnitin, GPTZero, QuillBot o Grammarly. |
| **Dependencias Externas** | Usar librerías de código abierto consolidadas con licencias permisivas (MIT, Apache 2.0, BSD) debidamente auditadas. | Incorporar librerías con licencias copyleft restrictivas (GPL/AGPL) que comprometan la propiedad del código, o paquetes sin procedencia clara. |

> ⚖️ **Certificación Legal:** Cada artefacto, pantalla y archivo de código debe superar la auditoría legal previa antes de su aprobación por Gerencia. Se mantiene una trazabilidad limpia del origen de cada línea de código.

---

## 3. Estructura de Equipos y Trabajadores Especializados

### 1. 💼 Equipo de Ventas & Estrategia de Mercado (`sales-lead`)
- **Líder:** Director de Ventas y Estrategia Comercial.
- **Misión:** Validar el Product-Market Fit (PMF), estudiar a la competencia y garantizar que la plataforma solucione dolores críticos reales del mercado.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Investigador de Mercado (Market Research Analyst):**
     - Análisis exhaustivo de competidores directos e indirectos (Turnitin, GPTZero, QuillBot, Copyleaks, Scribbr).
     - Identificación de segmentos clave: estudiantes universitarios, tesistas, docentes, investigadores y creadores de contenido.
     - Detección de dolores latentes: falsos positivos de IA, sanciones académicas injustas y falta de trazabilidad en revisiones.
  2. **Estratega de Monetización y Pricing:**
     - Definición de esquemas de precios sostenibles (acceso freemium, paquetes prepago por créditos/documentos o suscripción recurrente accesible).
     - Simulación de costos operativos frente a ingresos esperados para garantizar rentabilidad.
  3. **Especialista en Propuesta de Valor (Value Proposition Designer):**
     - Articulación del diferencial competitivo: "Revisión académica transparente y privada sin subir tus documentos a bases de datos de terceros".

---

### 2. 📢 Equipo de Marketing & Rebranding (`marketing-lead`)
- **Líder:** Director de Marketing de Crecimiento & Marca.
- **Misión:** Redefinir la narrativa, el nuevo nombre comercial (rebranding), el posicionamiento de marca y la adquisición orgánica mediante SEO técnico de impacto.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Especialista en Rebranding & Naming:**
     - Propuesta y validación de nuevos nombres innovadores, memorables y con disponibilidad de dominios/redes.
     - Construcción del mensaje central de marca: confianza, rigor académico, tranquilidad y soberanía de datos.
  2. **Especialista en SEO Técnico & Estrategia de Contenidos:**
     - Investigación de palabras clave con alta intención de búsqueda (*"revisión de tesis antes de entregar"*, *"comprobar citas académicas"*, *"verificar índice de IA Turnitin"*).
     - Optimización de metadatos semánticos: Open Graph, Twitter Cards, JSON-LD Schema estructurado (EducationalApplication / WebApplication).
  3. **Especialista en Conversión y CRO (Conversion Rate Optimization):**
     - Copywriting persuasivo en landing page: títulos H1 cautivadores, prueba social, manejo de objeciones y llamadas a la acción (CTAs) claras.

---

### 3. 🎨 Equipo de Diseño Completo & Branding (`brand-design-lead`)
- **Líder:** Director Creativo & Diseñador de Identidad Visual.
- **Misión:** Crear una identidad visual innovadora, moderna y hermosa, con concordancia total entre branding, logo, tipografía y estilo en desktop y móviles, coordinado con Marketing y Ventas.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Diseñador de Identidad Visual & Logotipos:**
     - Creación de logotipo e isotipo vectorial moderno (SVG escalable, favicon 16x16 / 32x32 / 192x192 / 512x512, versión modo claro y modo oscuro).
     - Manual de identidad: paleta cromática sofisticada (primario, secundario, superficies, acentos semánticos de alerta y éxito) con alto contraste WCAG.
  2. **Especialista en Sistema de Diseño (Design System Engineer):**
     - Creación de tokens CSS estandarizados (variables de color, elevación, espaciado de 4/8px, radios de borde suaves y tipografía fluida).
     - Integración con herramientas avanzadas (Google Stitch MCP Server) para generación de variantes y consistencia de componentes.
  3. **Diseñador Gráfico & Assets Web:**
     - Ilustraciones vectoriales limpias, micrográficos para estados vacíos (empty states) y badges de certificación de privacidad y rigor.

---

### 4. ✨ Equipo de Experiencia de Usuario (`ux-lead`)
- **Líder:** Lead UX/UI Product Designer.
- **Misión:** Diseñar una experiencia intuitiva, fluida y sin fricciones, donde cualquier usuario entienda y disfrute el uso de la plataforma en computadora y móvil.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Arquitecto de Información & Flujos de Usuario:**
     - Flujo principal en 3 clics o menos: Selección de tipo de entrega -> Carga de archivo (Word/PDF/Texto) -> Visualización instantánea con panel de acciones.
     - Reducción de carga cognitiva: jerarquía clara entre advertencias metodológicas, bibliografía y datos de autoría.
  2. **Especialista en Interacción y Microfeedback:**
     - Feedback de estados (arrastrar y soltar con animación, loaders minimalistas, confirmaciones no intrusivas tipo toast/snackbars).
     - Modo oscuro/claro con transición suave y persistencia local de preferencias del usuario.
  3. **Auditor de Accesibilidad (WCAG 2.1 AA/AAA):**
     - Navegación completa por teclado (focus-visible accesible), compatibilidad con lectores de pantalla (ARIA labels) y objetivos táctiles móviles de mínimo 48x48px.

---

### 5. 💻 Equipo de Programación & Depuración (`code-lead`)
- **Líder:** Lead Software Engineer & Code Architect.
- **Misión:** Depuración profunda de código, refactorización a estándares limpios, eliminación de deuda técnica, modularidad y robustez total.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Ingeniero de Depuración & Clean Code:**
     - Depuración y limpieza de scripts existentes (`index.html`, `js/`, `core/`, `app.py`).
     - Eliminación de código huérfano, variables globales no controladas, funciones duplicadas y llamadas bloqueantes.
     - Refactorización hacia módulos ES6 limpios, desacoplados y auto-documentados.
  2. **Ingeniero Frontend Core:**
     - Manejo eficiente del DOM y del ciclo de vida de la aplicación.
     - Motor de parsing de documentos en cliente (Word docx, PDF, texto plano) sin fugas de memoria (`memory leaks`).
     - Sistema de exportación de informes confiable en formatos Markdown, JSON y descargables limpios.

---

### 6. ⚡ Equipo de Optimización & Rendimiento (`performance-lead`)
- **Líder:** Web Performance & Core Web Vitals Engineer.
- **Misión:** Conseguir una velocidad de carga instantánea, puntajes máximos de Lighthouse (95-100), adaptación responsiva fluida y cero tiempos de espera.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Especialista en Core Web Vitals (LCP, INP, CLS):**
     - Largest Contentful Paint (LCP < 1.0s), Interaction to Next Paint (INP ultra bajo) y Cumulative Layout Shift (CLS = 0).
     - Estrategia de carga asíncrona / diferida de fuentes, scripts de parsing y librerías externas.
  2. **Especialista en Diseño Responsivo Móvil & Ultrawide:**
     - Adaptación elástica completa: smartphones (360px - 430px), tablets (768px - 1024px), laptops (1280px - 1920px) y monitores ultrawide (> 2560px).
     - Prevención absoluta de desbordamientos horizontales (`horizontal overflow`), menús móviles fluidos y tablas/paneles deslizables intuitivos.
  3. **Especialista en Optimización de Activos & Caché:**
     - Compresión de tipografías (WOFF2 con subsetting), minificación de CSS/JS, optimización de SVGs y Service Worker para trabajo offline / caché inteligente.

---

### 7. 🧪 Equipo de Calidad Integral (`qa-lead`)
- **Líder:** Head of Quality Assurance & Verification.
- **Misión:** *(Definida por el Gerente General)*: Mantener bajo control absoluto la fiabilidad del software mediante pruebas automatizadas, manuales, de estrés y de límites, garantizando cero regresiones y cero errores en producción.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Ingeniero de Pruebas Automatizadas (QA Automation):**
     - Ejecución y mantenimiento de suites de pruebas (`python -m unittest`, `node tests/`, validadores de reglas bibliográficas y metodológicas).
     - Validación continua de hashes criptográficos (SHA-256) para asegurar que el contenido no se corrompa en el procesamiento.
  2. **Tester de Compatibilidad Cross-Browser & Multi-Dispositivo:**
     - Pruebas exhaustivas en motores Chromium (Chrome, Edge, Brave), WebKit (Safari en iOS y macOS) y Gecko (Firefox).
     - Verificación de comportamiento en dispositivos físicos y simulados con pantallas de diferentes densidades de píxeles (Retina / OLED).
  3. **Tester de Casos Límite y Resiliencia (Edge-Cases & Stress Testing):**
     - Pruebas con archivos gigantes (tesis de más de 300 páginas), documentos corruptos, formatos no estándar, textos en idiomas mixtos y cortes repentinos de conexión.
     - Cero excepciones no controladas en consola (`0 unhandled exceptions`).

---

### 8. ⚖️ Equipo Legal & Cumplimiento Normativo (`legal-lead`)
- **Líder:** Asesor Jurídico Digital & Oficial de Cumplimiento (Compliance Officer).
- **Misión:** Blindar legalmente el producto para su publicación global y abierta a todo público, salvaguardando la propiedad intelectual, privacidad de datos y deslindes éticos.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Especialista en Privacidad de Datos (Data Privacy Counsel - GDPR / CCPA / Regulaciones LatAm):**
     - Redacción de la Política de Privacidad centrada en la arquitectura Client-Side: certificación formal de que los documentos académicos no se suben ni se almacenan en servidores externos, ni se usan para entrenar IA.
     - Cumplimiento de políticas de cookies mínimas o nulas (cero rastreadores invasivos).
  2. **Especialista en Términos y Condiciones & Deslinde de Responsabilidad:**
     - Redacción de Términos de Servicio (Terms of Service) para uso público general.
     - Cláusula expresa de deslinde y transparencia respecto a plataformas de terceros (Turnitin, universidades, etc.): el software es una herramienta auxiliar de revisión editorial y no emite certificaciones institucionales de aprobación ni garantiza calificaciones.
  3. **Especialista en Propiedad Intelectual y Licenciamiento:**
     - Registro y protección del nuevo nombre comercial y logotipo.
     - Auditoría de licencias de dependencias externas (cero incompatibilidades de código abierto).

---

### 9. 🚀 Equipo de Despliegue & Infraestructura Low-Cost (`devops-lead`)
- **Líder:** DevOps & Cloud Solutions Architect.
- **Misión:** Diseñar la estrategia y el plan maestro para desplegar la plataforma a internet con máxima disponibilidad, seguridad HTTPS y un coste operativo prácticamente nulo (o de muy bajo costo), listo para ejecutar cuando se decida el lanzamiento.
- **Especialistas y Trabajadores asignados por Gerencia:**
  1. **Arquitecto de Infraestructura de Bajo Costo (Zero-to-Low Cost Cloud Architect):**
     - Selección de plataforma de despliegue óptima para frontend estático + client-side processing:
       * **Opción Principal Recomendada:** *Cloudflare Pages* (Tráfico ilimitado, SSL automático gratuito, CDN global en más de 300 ciudades, costo $0/mes en capa inicial).
       * **Opciones Alternativas:** *Vercel / Netlify / GitHub Pages* con dominio personalizado (`.com` o `.ai`).
       * **Backend opcional ligero:** Si en el futuro se requiere API para pagos o base de datos, serverless functions con Firebase o Supabase en capas gratuitas.
  2. **Ingeniero de Automatización & CI/CD:**
     - Configuración de pipelines en GitHub Actions para compilar el sitio (`tools/build_site.py`), pasar la suite de pruebas QA y desplegar automáticamente al hacer commit en la rama principal.
  3. **Especialista en Seguridad Perimetral y Monitoreo:**
     - Protección contra ataques DDoS, cabeceras HTTP de seguridad (CSP, HSTS, X-Content-Type-Options) y monitoreo de uptime gratuito (ej. UptimeRobot o BetterStack).

---

## 4. Matriz de Integración y Sinergia Inter-Equipos

| Fase | Equipos Colaboradores | Entregable Principal |
| :--- | :--- | :--- |
| **Fase 1: Estrategia, Branding y Mercado** | Gerencia + Ventas + Marketing + Diseño | Estudio de mercado, nueva propuesta de valor, nuevo nombre comercial, logotipo y manual de marca. |
| **Fase 2: Arquitectura Legal & Experiencia** | Legal + Marketing + UX/UI + Diseño | Términos de uso, política de privacidad client-side, sistema de diseño unificado (CSS tokens) y prototipos UX responsive. |
| **Fase 3: Depuración y Construcción Core** | Programación + Optimización + UX/UI | Código depurado, refactorizado, sin deuda técnica, navegación fluida y tiempos de carga instantáneos en móvil y PC. |
| **Fase 4: Control de Calidad y Blindaje** | Calidad (QA) + Programación + Legal | Batería de pruebas cruzadas, certificación de cero errores de consola, verificación de límites y validación legal. |
| **Fase 5: Preparación de Despliegue Low-Cost** | Despliegue (DevOps) + Gerencia | Plan de despliegue configurado (Cloudflare Pages / GitHub Pages / CI-CD) listo para publicación global inmediata con costo mínimo. |

---

## 5. Integración con Servidores y Herramientas MCP

- **Google Stitch MCP Server (`stitch`):**
  - Servidor MCP integrado en `.agents/mcp_config.json`.
  - Utilizado por el **Equipo de Diseño** y el **Equipo de UX/UI** para explorar pantallas, variantes estilísticas, tokens de diseño y generación ágil de componentes visuales modernos.
