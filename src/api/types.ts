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

export interface MesaUpdate {
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

/**
 * Contrato de `estado` agregado por BE-020 (soft-delete de una venta) y
 * BE-025 (`abierta`: pedido en curso en una mesa, todavía sin cobrar).
 */
export type EstadoVenta = 'activa' | 'cancelada' | 'abierta'

export interface VentaItemCreate {
  producto_id: number
  cantidad: number
}

export interface VentaCreate {
  items: VentaItemCreate[]
  metodo_pago: MetodoPago
  mesa_id?: number | null
}

/**
 * Payload de `PUT /ventas/{id}` (BE-021): misma forma que `VentaCreate`
 * (reemplazo completo de items/mesa/método de pago).
 */
export interface VentaUpdate {
  items: VentaItemCreate[]
  metodo_pago: MetodoPago
  mesa_id?: number | null
}

/** Payload de `POST /ventas/abrir` (BE-025): abre un pedido vacío en una mesa. */
export interface VentaAbrir {
  mesa_id: number
}

/** Payload de `POST /ventas/{id}/items` (BE-026): agrega líneas nuevas a un pedido abierto. */
export interface VentaAgregarItems {
  items: VentaItemCreate[]
}

/** Payload de `POST /ventas/{id}/cerrar` (BE-027): cobra y cierra un pedido abierto. */
export interface VentaCerrar {
  metodo_pago: MetodoPago
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
  /** `null` mientras la venta está `abierta` (BE-025): se asigna al cerrarla. */
  metodo_pago: MetodoPago | null
  estado: EstadoVenta
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
