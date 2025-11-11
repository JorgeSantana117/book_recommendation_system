
# Book Recommendation System

Este proyecto implementa una **arquitectura de tres capas** basada en **React (Frontend)**, **Backendless (Backend)** y las **tablas nativas de Backendless (Base de Datos)**.  
El sistema permite la autenticación de usuarios, la personalización de preferencias y la generación automática de recomendaciones de libros.

---

## 🚀 Estructura del Proyecto

```
book-rec-mvp/
│
├── frontend/                      # Aplicación React
│   ├── src/
│   │   ├── api/                   # Configuración de conexión con Backendless
│   │   ├── screens/               # Pantallas: SignIn, SignUp, Onboarding, Catalog, Suggestions
│   │   ├── App.jsx                # Rutas y navegación principal
│   │   └── main.jsx               # Punto de entrada de React
│   ├── public/                    # Archivos estáticos
│   └── package.json               # Dependencias de frontend
│
└── backend/                       # Servicios Backendless (Cloud Code)
    └── services/
        ├──SuggestionsService.js   # Generación de recomendaciones personalizadas
        └── AggregatesService.js   # Cálculo de afinidades del usuario
```

---

## 🧠 Arquitectura

**Capa de Presentación (Frontend):**  
- Implementada en React.  
- Maneja navegación, formularios y renderizado dinámico.  

**Capa de Lógica (Backend):**  
- Construida en Backendless con servicios personalizados (`SuggestionsService`, `AggregatesService`).  
- Gestiona reglas de negocio, recomendaciones y afinidades.  

**Capa de Datos (Base de Datos):**  
- Usa tablas nativas de Backendless (`Books`, `Feedback`, `UserAggregates`, `HiddenItems`, `Config`).  

---

## 🔑 Casos de Uso Principales

1. **Autenticación de usuario** (Sign In / Sign Up).  
2. **Onboarding** para registrar preferencias iniciales.  
3. **Catálogo de libros** con búsqueda por título.  
4. **Sistema de retroalimentación:** valoración, comentarios y ocultar libros.  
5. **Recomendaciones personalizadas** basadas en afinidades y feedback del usuario.  

---

## 🧩 Tecnologías

- **Frontend:** React + Vite  
- **Backend:** Backendless Cloud Code (JavaScript)  
- **Base de Datos:** Backendless Data Tables  
- **Autenticación:** Backendless User Service  

---

## 🧪 Ejecución Local

```bash
# 1. Instalar dependencias
cd frontend
npm install

# 2. Ejecutar servidor de desarrollo
npm run dev

# 3. Abrir en navegador
http://localhost:5173/
```

---

## 👨‍💻 Autores

Curso: *Análisis, diseño y construcción de software*  
Equipo: *31*
# book_recommendation_system
