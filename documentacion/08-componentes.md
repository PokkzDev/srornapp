# Componentes React

Documentación de los componentes React reutilizables del sistema SRORN.

## Componentes Principales

### DashboardLayout

Componente de layout principal que envuelve todas las páginas del dashboard.

**Ubicación**: `src/components/DashboardLayout.js`

**Uso**:
```jsx
import DashboardLayout from '@/components/DashboardLayout'

export default function Page() {
  return (
    <DashboardLayout>
      <h1>Contenido de la página</h1>
    </DashboardLayout>
  )
}
```

**Props**: 
- `children` (ReactNode) - Contenido de la página

**Características**:
- Incluye el Sidebar automáticamente
- Proporciona estructura de layout consistente
- Maneja el espaciado y diseño responsivo

### Sidebar

Barra lateral de navegación que muestra módulos según permisos del usuario.

**Ubicación**: `src/components/Sidebar.js`

**Características**:
- Muestra módulos según permisos del usuario
- Organiza módulos en secciones (Módulos, Informes)
- Obtiene permisos del servidor (Server Component)
- Enlaces a todas las secciones del dashboard

**Módulos Mostrados**:
- Módulo Madres (si tiene `madre:view`)
- Módulo Partos (si tiene `parto:view`)
- Módulo Recién Nacidos (si tiene `recien-nacido:view`)
- Atención URN (si tiene `atencion_urn:create`)
- Episodios URNI (si tiene `urni:read` o `urni:episodio:view`)
- Control Neonatal (si tiene `control_neonatal:create`)
- Módulo de Alta (si tiene `modulo_alta:aprobar`)
- Indicadores (si tiene `indicadores:consult`)
- Auditoría (si tiene `auditoria:review`)
- Reportes REM (si tiene `reporte_rem:generate`)
- Usuarios (si tiene `user:view`)

### UserMenu

Menú de usuario que muestra información del usuario actual y opción de logout.

**Ubicación**: `src/components/UserMenu.js`

**Características**:
- Muestra nombre y roles del usuario
- Opción para cerrar sesión
- Integrado en el Sidebar

### Modal

Componente modal reutilizable para mostrar contenido en overlay.

**Ubicación**: `src/components/Modal.js`

**Props**:
- `isOpen` (boolean) - Si el modal está abierto
- `onClose` (function) - Función para cerrar el modal
- `title` (string) - Título del modal
- `children` (ReactNode) - Contenido del modal

**Uso**:
```jsx
import Modal from '@/components/Modal'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Título del Modal"
      >
        <p>Contenido del modal</p>
      </Modal>
    </>
  )
}
```

**Estilos**: `src/components/Modal.module.css`

### MadreForm

Formulario para crear y editar madres.

**Ubicación**: `src/components/MadreForm.js`

**Props**:
- `madre` (object, opcional) - Datos de la madre para edición
- `onSubmit` (function) - Función llamada al enviar el formulario
- `onCancel` (function) - Función llamada al cancelar

**Campos**:
- RUT (con validación)
- Nombres
- Apellidos
- Edad
- Fecha de nacimiento
- Dirección
- Teléfono
- Ficha clínica
- Campos REM (pueblo originario, migrante, discapacidad, etc.)

**Características**:
- Validación de RUT chileno
- Formateo automático de RUT mientras se escribe
- Validación de campos requeridos
- Manejo de errores

**Estilos**: `src/components/MadreForm.module.css`

### PartoForm

Formulario para crear y editar partos.

**Ubicación**: `src/components/PartoForm.js`

**Props**:
- `parto` (object, opcional) - Datos del parto para edición
- `madreId` (string) - ID de la madre (requerido para crear)
- `onSubmit` (function) - Función llamada al enviar
- `onCancel` (function) - Función llamada al cancelar

**Campos**:
- Fecha y hora del parto
- Tipo de parto (select con enum)
- Lugar del parto (select con enum)
- Detalle del lugar (si es "OTRO")
- Profesionales (matronas, médicos, enfermeras) - multi-select
- Complicaciones (texto)
- Observaciones
- Campos de buenas prácticas
- Campos de modelo de atención

**Características**:
- Validación de fecha (no futura)
- Validación de profesionales requeridos
- Carga de profesionales disponibles desde API
- Validación de cesárea requiere médico

**Estilos**: `src/components/PartoForm.module.css`

### RecienNacidoForm

Formulario para crear y editar recién nacidos.

**Ubicación**: `src/components/RecienNacidoForm.js`

**Props**:
- `recienNacido` (object, opcional) - Datos del RN para edición
- `partoId` (string) - ID del parto (requerido para crear)
- `onSubmit` (function) - Función llamada al enviar
- `onCancel` (function) - Función llamada al cancelar

**Campos**:
- Sexo (M, F, I)
- Peso al nacer (gramos)
- Talla (cm)
- Apgar al minuto (0-10)
- Apgar a los 5 minutos (0-10)
- Observaciones
- Campos REM (anomalías, reanimación, profilaxis, etc.)

**Características**:
- Validación de rangos (Apgar 0-10)
- Validación de valores numéricos
- Campos condicionales según tipo de RN

**Estilos**: `src/components/RecienNacidoForm.module.css`

## Estilos

Todos los componentes utilizan **CSS Modules** para estilos encapsulados.

**Convención de Nombres**:
- Archivo de componente: `ComponentName.js`
- Archivo de estilos: `ComponentName.module.css`
- Clases CSS: camelCase (ej: `container`, `formGroup`, `buttonPrimary`)

**Ejemplo**:
```css
/* ComponentName.module.css */
.container {
  padding: 1rem;
}

.formGroup {
  margin-bottom: 1rem;
}

.buttonPrimary {
  background-color: #0070f3;
  color: white;
}
```

```jsx
import styles from './ComponentName.module.css'

function ComponentName() {
  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>...</div>
      <button className={styles.buttonPrimary}>Enviar</button>
    </div>
  )
}
```

## Patrones de Uso

### Formularios

Los formularios siguen este patrón:

1. **Estado Local**: Usan `useState` para manejar valores del formulario
2. **Validación**: Validación en tiempo real y al enviar
3. **Submit**: Llaman a API y manejan respuesta
4. **Errores**: Muestran errores de validación y de API
5. **Loading**: Muestran estado de carga durante submit

**Ejemplo**:
```jsx
function MyForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (response.ok) {
        onSubmit(data)
      } else {
        setErrors({ submit: data.error })
      }
    } catch (error) {
      setErrors({ submit: 'Error de conexión' })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* campos del formulario */}
      {errors.submit && <div className="error">{errors.submit}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
```

### Listas con Paginación

Las listas usan paginación del servidor:

```jsx
function MyList() {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  
  const fetchData = async (page) => {
    const response = await fetch(`/api/endpoint?page=${page}&limit=20`)
    const result = await response.json()
    setData(result.data)
    setPagination(result.pagination)
  }
  
  useEffect(() => {
    fetchData(1)
  }, [])
  
  return (
    <>
      {data.map(item => <Item key={item.id} data={item} />)}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={fetchData}
      />
    </>
  )
}
```

### Búsqueda

Los componentes de búsqueda usan debounce:

```jsx
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState([])
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        fetch(`/api/endpoint?search=${searchTerm}`)
          .then(res => res.json())
          .then(data => setResults(data.data))
      }
    }, 300) // debounce de 300ms
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar..."
    />
  )
}
```

## Mejores Prácticas

### Componentes Reutilizables

1. **Props Claras**: Definir props con nombres descriptivos
2. **Validación**: Validar props cuando sea necesario
3. **Estilos Encapsulados**: Usar CSS Modules para evitar conflictos
4. **Manejo de Errores**: Manejar errores de forma elegante
5. **Accesibilidad**: Usar elementos semánticos y ARIA cuando sea necesario

### Performance

1. **Memoización**: Usar `useMemo` y `useCallback` cuando sea necesario
2. **Lazy Loading**: Cargar componentes pesados de forma diferida
3. **Optimización de Re-renders**: Evitar re-renders innecesarios

### Mantenibilidad

1. **Nombres Descriptivos**: Usar nombres claros para componentes y funciones
2. **Comentarios**: Comentar lógica compleja
3. **Separación de Responsabilidades**: Un componente, una responsabilidad
4. **Reutilización**: Extraer lógica común a componentes reutilizables

---

**Anterior**: [Módulos](07-modulos.md) | **Siguiente**: [Desarrollo](09-desarrollo.md)

