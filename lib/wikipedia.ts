/**
 * lib/wikipedia.ts
 * Servicio para consumir la Wikipedia API en español.
 * Incluye rotación de artículos, caché de sesión y reintentos.
 */

export type Tema = 'Historia' | 'Geografía' | 'Matemáticas' | 'Cine'

// Artículos base por tema (nivel medio-bajo, cultura general)
const ARTICULOS_POR_TEMA: Record<Tema, string[]> = {
  Historia: [
    'Segunda_Guerra_Mundial',
    'Imperio_romano',
    'Revolución_francesa',
    'Cristóbal_Colón',
    'Edad_Media',
    'Aztecas',
    'Antigua_Grecia',
    'Napoleón_Bonaparte',
    'Primera_Guerra_Mundial',
    'Conquista_de_América',
    'Revolución_mexicana',
    'Independencia_de_Estados_Unidos',
    'Antigua_Roma',
    'Imperio_español',
    'Revolución_rusa',
  ],
  Geografía: [
    'Amazon_(río)',
    'Cordillera_de_los_Andes',
    'Sahara',
    'Océano_Pacífico',
    'Continente_africano',
    'Río_Nilo',
    'Himalaya',
    'Selva_amazónica',
    'Desierto_de_Atacama',
    'Mediterráneo',
    'Gran_Barrera_de_Coral',
    'Siberia',
    'Patagonia',
    'Europa_(continente)',
    'Australia_(continente)',
  ],
  Matemáticas: [
    'Número_pi',
    'Teorema_de_Pitágoras',
    'Números_primos',
    'Álgebra',
    'Geometría',
    'Estadística',
    'Trigonometría',
    'Números_naturales',
    'Sistema_métrico',
    'Fracciones',
    'Potencia_(matemáticas)',
    'Simetría',
    'Probabilidad',
    'Cálculo_diferencial',
    'Lógica_matemática',
  ],
  Cine: [
    'Cine_de_Hollywood',
    'Película_(medio)',
    'Oscar_(premio)',
    'Charles_Chaplin',
    'Historia_del_cine',
    'Animación',
    'Alfred_Hitchcock',
    'Steven_Spielberg',
    'Cannes_(festival_de_cine)',
    'Cine_mudo',
    'James_Bond',
    'Disney_(empresa)',
    'Ciencia_ficción_(cine)',
    'Pedro_Almodóvar',
    'Cine_de_terror',
  ],
}

// Caché en memoria para evitar repetir artículos y reducir llamadas a Wikipedia
const articulosUsados: Record<string, Set<string>> = {}

export interface ExtractoWikipedia {
  titulo: string
  extracto: string
  url: string
}

/**
 * Obtiene un extracto de Wikipedia para el tema indicado,
 * rotando artículos para no repetir en la misma sesión.
 */
export async function obtenerExtractoWikipedia(
  tema: Tema,
  sessionId: string = 'default'
): Promise<ExtractoWikipedia> {
  const baseUrl = process.env.WIKIPEDIA_API_BASE || 'https://es.wikipedia.org/api/rest_v1'
  const articulos = ARTICULOS_POR_TEMA[tema]

  // Inicializar set de usados para esta sesión
  const cacheKey = `${sessionId}_${tema}`
  if (!articulosUsados[cacheKey]) {
    articulosUsados[cacheKey] = new Set()
  }

  const usados = articulosUsados[cacheKey]

  // Si todos los artículos han sido usados, resetear
  if (usados.size >= articulos.length) {
    articulosUsados[cacheKey] = new Set()
  }

  // Filtrar artículos no usados
  const disponibles = articulos.filter((a) => !usados.has(a))

  // Seleccionar un artículo aleatorio de los disponibles
  const articulo = disponibles[Math.floor(Math.random() * disponibles.length)]
  usados.add(articulo)

  let intentos = 0
  const maxIntentos = 3

  while (intentos < maxIntentos) {
    try {
      const response = await fetch(
        `${baseUrl}/page/summary/${encodeURIComponent(articulo)}`,
        {
          headers: {
            'User-Agent': 'TrivialRetro/1.0 (juego educativo)',
            Accept: 'application/json',
          },
          // Timeout de 8 segundos
          signal: AbortSignal.timeout(8000),
        }
      )

      if (!response.ok) {
        throw new Error(`Wikipedia devolvió ${response.status}`)
      }

      const data = await response.json()

      // Verificar que el extracto tiene suficiente contenido
      if (data.extract && data.extract.length > 100) {
        return {
          titulo: data.title || articulo,
          extracto: data.extract,
          url: data.content_urls?.desktop?.page || '',
        }
      }

      // Si el extracto es muy corto, intentar con otro artículo
      intentos++
      const otroArticulo = disponibles[Math.floor(Math.random() * disponibles.length)]
      usados.add(otroArticulo)
    } catch {
      intentos++
      // Pequeño delay antes de reintentar
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  throw new Error(`No se pudo obtener contenido de Wikipedia para el tema: ${tema}`)
}

/**
 * Trunca el extracto a un fragmento útil para generar la pregunta.
 * Toma el primer párrafo o los primeros 400 caracteres.
 */
export function truncarExtracto(extracto: string, maxChars: number = 400): string {
  // Intentar tomar el primer párrafo completo
  const primerParrafo = extracto.split('\n\n')[0]
  if (primerParrafo.length <= maxChars) {
    return primerParrafo
  }
  // Si es muy largo, truncar por oraciones
  const oraciones = extracto.split(/[.!?]+\s/)
  let resultado = ''
  for (const oracion of oraciones) {
    if ((resultado + oracion).length > maxChars) break
    resultado += oracion + '. '
  }
  return resultado.trim() || extracto.substring(0, maxChars)
}
