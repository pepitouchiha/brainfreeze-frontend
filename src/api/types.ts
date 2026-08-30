/**
 * Contrato de POST /auth/login confirmado contra el backend real
 * (backend/app/schemas/auth.py: LoginRequest, TokenResponse).
 */
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

/**
 * Contrato de /categorias confirmado contra el backend real
 * (backend/app/schemas/categoria.py).
 */
export interface Categoria {
  id: number
  nombre: string
  color: string
  productos_count: number
}

export interface CategoriaCreate {
  nombre: string
  color?: string
}

export interface CategoriaUpdate {
  nombre?: string
  color?: string
}

/**
 * Contrato de /mesas confirmado contra el backend real
 * (backend/app/schemas/mesa.py).
 */
export type EstadoMesa = 'libre' | 'ocupada'

export interface Mesa {
  id: number
  nombre_o_numero: string
  estado: EstadoMesa
}

export interface MesaCreate {
  nombre_o_numero: string
}

/**
 * Contrato de /productos confirmado contra el backend real
 * (backend/app/schemas/producto.py).
 */
export type EstadoProducto = 'disponible' | 'agotado'

export interface Producto {
  id: number
  nombre: string
  categoria_id: number
  precio: number
  costo: number | null
  estado: EstadoProducto
  sabor: string | null
  tamano: string | null
  imagen_base64: string | null
  creado_en: string
}

export interface ProductoCreate {
  nombre: string
  categoria_id: number
  precio: number
  costo?: number | null
  estado?: EstadoProducto
  sabor?: string | null
  tamano?: string | null
  imagen_base64?: string | null
}

export interface ProductoUpdate {
  nombre?: string
  categoria_id?: number
  precio?: number
  costo?: number | null
  estado?: EstadoProducto
  sabor?: string | null
  tamano?: string | null
  imagen_base64?: string | null
}

/**
 * Contrato de /insumos confirmado contra el backend real
 * (backend/app/schemas/insumo.py). `estado` se calcula siempre en backend
 * a partir de stock/stock_minimo, nunca se envía como input.
 */
export type EstadoInsumo = 'Crítico' | 'Bajo' | 'OK'

export interface Insumo {
  id: number
  nombre: string
  categoria_id: number
  stock: number
  stock_minimo: number
  estado: EstadoInsumo
}

export interface InsumoCreate {
  nombre: string
  categoria_id: number
  stock?: number
  stock_minimo?: number
}

export interface InsumoUpdate {
  nombre?: string
  categoria_id?: number
  stock_minimo?: number
}

export interface AjusteStock {
  cantidad: number
}

/**
 * Contrato de /ventas confirmado contra el backend real
 * (backend/app/schemas/venta.py). El total y el precio_unitario de cada item
 * siempre se calculan en el servidor a partir del precio actual del
 * producto — el cliente nunca envía totales.
 */
export type MetodoPago = 'efectivo' | 'transferencia'

export interface VentaItemCreate {
  producto_id: number
  cantidad: number
}

export interface VentaCreate {
  items: VentaItemCreate[]
  metodo_pago: MetodoPago
  mesa_id?: number | null
}

export interface VentaItem {
  id: number
  producto_id: number
  cantidad: number
  precio_unitario: number
}

export interface Venta {
  id: number
  mesa_id: number | null
  metodo_pago: MetodoPago
  total: number
  creado_en: string
  items: VentaItem[]
}

/**
 * Contrato de /reportes confirmado contra el backend real
 * (backend/app/schemas/reporte.py). Todos los montos vienen sin formatear
 * (enteros COP); el formateo a texto es responsabilidad del frontend.
 */
export interface VentaPorHora {
  hora: number
  total: number
  num_ventas: number
}

export interface ReporteHoyOut {
  fecha: string
  total: number
  num_ventas: number
  por_hora: VentaPorHora[]
  margen: number
  margen_incompleto: boolean
}

export interface VentaPorMes {
  anio: number
  mes: number
  total: number
  num_ventas: number
  ticket_promedio: number
  margen: number
  margen_incompleto: boolean
}

export interface ReporteMensualOut {
  meses: VentaPorMes[]
  ytd_total: number
  ytd_margen: number
  ytd_margen_incompleto: boolean
}
