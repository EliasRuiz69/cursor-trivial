/**
 * app/api/questions/route.ts
 * Genera preguntas de trivia a partir de artículos de Wikipedia.
 *
 * GET  /api/questions?tema=Historia&sessionId=abc
 *   → Devuelve una PreguntaPublica (sin revelar la respuesta correcta)
 *
 * POST /api/questions/validate
 *   → Valida la respuesta y devuelve ResultadoRespuesta
 *
 * Las respuestas correctas se almacenan en un mapa en memoria firmado
 * con un ID único por pregunta. NUNCA se exponen al cliente.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { obtenerExtractoWikipedia, truncarExtracto, Tema } from '@/lib/wikipedia'
import { PreguntaPublica, OpcionRespuesta } from '@/lib/types'
import { randomUUID } from 'crypto'

// ---------------------------------------------------------------
// Almacén temporal de respuestas correctas (en memoria del servidor)
// TTL de 30 minutos por pregunta
// ---------------------------------------------------------------
interface PreguntaSecreta {
  letraCorrecta: 'A' | 'B' | 'C' | 'D'
  explicacion: string
  expiresAt: number
}

const preguntasSecretas = new Map<string, PreguntaSecreta>()

// Limpiar preguntas expiradas cada 10 minutos
setInterval(() => {
  const ahora = Date.now()
  for (const [id, pregunta] of preguntasSecretas.entries()) {
    if (pregunta.expiresAt < ahora) {
      preguntasSecretas.delete(id)
    }
  }
}, 10 * 60 * 1000)

// ---------------------------------------------------------------
// Banco de preguntas estáticas por tema (respaldo y enriquecimiento)
// Garantiza que siempre haya preguntas de calidad disponibles.
// ---------------------------------------------------------------
interface PreguntaEstatica {
  pregunta: string
  opciones: { letra: 'A' | 'B' | 'C' | 'D'; texto: string }[]
  letraCorrecta: 'A' | 'B' | 'C' | 'D'
  explicacion: string
}

const BANCO_PREGUNTAS: Record<Tema, PreguntaEstatica[]> = {
  Historia: [
    {
      pregunta: '¿En qué año comenzó la Segunda Guerra Mundial?',
      opciones: [
        { letra: 'A', texto: '1935' },
        { letra: 'B', texto: '1939' },
        { letra: 'C', texto: '1941' },
        { letra: 'D', texto: '1945' },
      ],
      letraCorrecta: 'B',
      explicacion: 'La Segunda Guerra Mundial comenzó el 1 de septiembre de 1939 con la invasión alemana de Polonia. Esta invasión provocó que Francia y el Reino Unido declararan la guerra a Alemania dos días después.',
    },
    {
      pregunta: '¿Quién fue el primer emperador de Roma?',
      opciones: [
        { letra: 'A', texto: 'Julio César' },
        { letra: 'B', texto: 'Marco Antonio' },
        { letra: 'C', texto: 'Augusto' },
        { letra: 'D', texto: 'Nerón' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Augusto (Octavio Augusto) fue el primer emperador romano, gobernando desde el 27 a.C. hasta su muerte en el año 14 d.C. Antes de él, Roma era técnicamente una república.',
    },
    {
      pregunta: '¿En qué continente se desarrolló principalmente la civilización azteca?',
      opciones: [
        { letra: 'A', texto: 'América del Sur' },
        { letra: 'B', texto: 'América del Norte' },
        { letra: 'C', texto: 'Europa' },
        { letra: 'D', texto: 'África' },
      ],
      letraCorrecta: 'B',
      explicacion: 'Los aztecas desarrollaron su civilización en Mesoamérica, en el territorio que hoy ocupa México, parte de América del Norte. Su capital, Tenochtitlán, estaba ubicada donde hoy se encuentra la Ciudad de México.',
    },
    {
      pregunta: '¿Qué suceso marcó el inicio de la Revolución Francesa?',
      opciones: [
        { letra: 'A', texto: 'La ejecución de Luis XVI' },
        { letra: 'B', texto: 'La toma de la Bastilla' },
        { letra: 'C', texto: 'La declaración de los Derechos del Hombre' },
        { letra: 'D', texto: 'La coronación de Napoleón' },
      ],
      letraCorrecta: 'B',
      explicacion: 'La toma de la Bastilla el 14 de julio de 1789 es considerada el inicio simbólico de la Revolución Francesa. La Bastilla era una fortaleza-prisión que representaba el poder absolutista del rey.',
    },
    {
      pregunta: '¿Cuánto duró aproximadamente la Edad Media?',
      opciones: [
        { letra: 'A', texto: 'Unos 100 años' },
        { letra: 'B', texto: 'Unos 500 años' },
        { letra: 'C', texto: 'Unos 1000 años' },
        { letra: 'D', texto: 'Unos 200 años' },
      ],
      letraCorrecta: 'C',
      explicacion: 'La Edad Media abarcó aproximadamente desde el siglo V (caída del Imperio romano de Occidente en 476 d.C.) hasta finales del siglo XV (1492, descubrimiento de América), es decir, unos 1000 años.',
    },
    {
      pregunta: '¿Qué país lideró la colonización de América del Sur?',
      opciones: [
        { letra: 'A', texto: 'Francia' },
        { letra: 'B', texto: 'Inglaterra' },
        { letra: 'C', texto: 'Portugal y España' },
        { letra: 'D', texto: 'Holanda' },
      ],
      letraCorrecta: 'C',
      explicacion: 'La colonización de América del Sur fue liderada principalmente por España y Portugal. España colonizó la mayor parte del continente, mientras Portugal colonizó Brasil según el Tratado de Tordesillas de 1494.',
    },
    {
      pregunta: '¿En qué año llegó Cristóbal Colón a América?',
      opciones: [
        { letra: 'A', texto: '1488' },
        { letra: 'B', texto: '1490' },
        { letra: 'C', texto: '1492' },
        { letra: 'D', texto: '1500' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Cristóbal Colón llegó a América el 12 de octubre de 1492, cuando desembarcó en una isla del Caribe que llamó San Salvador. Este evento es considerado el "descubrimiento" europeo del continente americano.',
    },
    {
      pregunta: '¿Qué civilización construyó las pirámides de Guiza?',
      opciones: [
        { letra: 'A', texto: 'Los romanos' },
        { letra: 'B', texto: 'Los griegos' },
        { letra: 'C', texto: 'Los mayas' },
        { letra: 'D', texto: 'Los egipcios' },
      ],
      letraCorrecta: 'D',
      explicacion: 'Las pirámides de Guiza fueron construidas por los antiguos egipcios hace unos 4.500 años. La más grande, la Pirámide de Keops, fue construida alrededor del 2560 a.C. y es una de las Siete Maravillas del Mundo Antiguo.',
    },
  ],
  Geografía: [
    {
      pregunta: '¿Cuál es el río más largo del mundo?',
      opciones: [
        { letra: 'A', texto: 'El Amazonas' },
        { letra: 'B', texto: 'El Nilo' },
        { letra: 'C', texto: 'El Yangtsé' },
        { letra: 'D', texto: 'El Mississippi' },
      ],
      letraCorrecta: 'B',
      explicacion: 'El río Nilo, con aproximadamente 6.650 km, es generalmente considerado el río más largo del mundo. Atraviesa el noreste de África y desemboca en el Mar Mediterráneo. Aunque hay debate con el Amazonas, el Nilo mantiene el récord oficial.',
    },
    {
      pregunta: '¿En qué continente se encuentra el desierto del Sahara?',
      opciones: [
        { letra: 'A', texto: 'Asia' },
        { letra: 'B', texto: 'América del Sur' },
        { letra: 'C', texto: 'África' },
        { letra: 'D', texto: 'Australia' },
      ],
      letraCorrecta: 'C',
      explicacion: 'El Sahara se encuentra en el norte de África y es el desierto cálido más grande del mundo, con una superficie de aproximadamente 9 millones de km². Se extiende por 11 países africanos.',
    },
    {
      pregunta: '¿Cuál es la cordillera más larga del mundo?',
      opciones: [
        { letra: 'A', texto: 'Los Himalayas' },
        { letra: 'B', texto: 'Los Alpes' },
        { letra: 'C', texto: 'Los Andes' },
        { letra: 'D', texto: 'Las Rocosas' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Los Andes son la cordillera continental más larga del mundo, con aproximadamente 7.000 km de longitud. Recorren el lado occidental de América del Sur, desde Venezuela hasta el extremo sur de Argentina y Chile.',
    },
    {
      pregunta: '¿Cuál es el océano más grande del planeta?',
      opciones: [
        { letra: 'A', texto: 'Océano Atlántico' },
        { letra: 'B', texto: 'Océano Índico' },
        { letra: 'C', texto: 'Océano Ártico' },
        { letra: 'D', texto: 'Océano Pacífico' },
      ],
      letraCorrecta: 'D',
      explicacion: 'El Océano Pacífico es el más grande y profundo del mundo, cubriendo más de 165 millones de km². Es más grande que todos los continentes juntos y contiene más de la mitad de toda el agua oceánica de la Tierra.',
    },
    {
      pregunta: '¿Cuántos continentes hay en el planeta Tierra?',
      opciones: [
        { letra: 'A', texto: '5' },
        { letra: 'B', texto: '6' },
        { letra: 'C', texto: '7' },
        { letra: 'D', texto: '8' },
      ],
      letraCorrecta: 'C',
      explicacion: 'La Tierra tiene 7 continentes: África, América del Norte, América del Sur, Antártida, Asia, Europa y Oceanía (o Australia). Este modelo es el más utilizado en la enseñanza occidental.',
    },
    {
      pregunta: '¿En qué país se encuentra la selva amazónica?',
      opciones: [
        { letra: 'A', texto: 'Solo en Brasil' },
        { letra: 'B', texto: 'Brasil y otros países sudamericanos' },
        { letra: 'C', texto: 'Solo en Colombia' },
        { letra: 'D', texto: 'Solo en Venezuela' },
      ],
      letraCorrecta: 'B',
      explicacion: 'La selva amazónica se extiende principalmente por Brasil (60%) pero también por Perú, Colombia, Venezuela, Ecuador, Bolivia y otros países. Es el bosque tropical más grande del mundo y alberga el 10% de todas las especies del planeta.',
    },
    {
      pregunta: '¿Cuál es el punto más alto de la Tierra?',
      opciones: [
        { letra: 'A', texto: 'K2' },
        { letra: 'B', texto: 'Monte Kilimanjaro' },
        { letra: 'C', texto: 'Monte Everest' },
        { letra: 'D', texto: 'Monte Aconcagua' },
      ],
      letraCorrecta: 'C',
      explicacion: 'El Monte Everest, en la cordillera del Himalaya en la frontera entre Nepal y Tibet (China), es el punto más alto de la Tierra con 8.849 metros sobre el nivel del mar. Fue escalado por primera vez en 1953.',
    },
    {
      pregunta: '¿Cuál es el país más grande del mundo por superficie?',
      opciones: [
        { letra: 'A', texto: 'China' },
        { letra: 'B', texto: 'Estados Unidos' },
        { letra: 'C', texto: 'Canadá' },
        { letra: 'D', texto: 'Rusia' },
      ],
      letraCorrecta: 'D',
      explicacion: 'Rusia es el país más grande del mundo con una superficie de aproximadamente 17,1 millones de km², lo que representa el 11% de la superficie terrestre total. Se extiende por Europa del Este y el norte de Asia.',
    },
  ],
  Matemáticas: [
    {
      pregunta: '¿Cuánto es el perímetro de un cuadrado con lado de 5 cm?',
      opciones: [
        { letra: 'A', texto: '10 cm' },
        { letra: 'B', texto: '20 cm' },
        { letra: 'C', texto: '25 cm' },
        { letra: 'D', texto: '15 cm' },
      ],
      letraCorrecta: 'B',
      explicacion: 'El perímetro de un cuadrado se calcula multiplicando el lado por 4. Con lado de 5 cm: 5 × 4 = 20 cm. El perímetro es la suma de todos los lados de una figura geométrica.',
    },
    {
      pregunta: '¿Cuántos lados tiene un hexágono?',
      opciones: [
        { letra: 'A', texto: '5' },
        { letra: 'B', texto: '7' },
        { letra: 'C', texto: '6' },
        { letra: 'D', texto: '8' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Un hexágono es un polígono de 6 lados y 6 ángulos. Un ejemplo muy conocido de hexágono en la naturaleza son las celdas de los panales de las abejas, que tienen esta forma para aprovechar al máximo el espacio.',
    },
    {
      pregunta: '¿Cuál de estos números es primo?',
      opciones: [
        { letra: 'A', texto: '4' },
        { letra: 'B', texto: '9' },
        { letra: 'C', texto: '13' },
        { letra: 'D', texto: '15' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Un número primo solo es divisible entre 1 y entre sí mismo. El 13 es primo porque sus únicos divisores son 1 y 13. El 4 = 2×2, el 9 = 3×3, y el 15 = 3×5, por lo que estos no son primos.',
    },
    {
      pregunta: '¿Cuál es el valor aproximado del número pi (π)?',
      opciones: [
        { letra: 'A', texto: '2.71' },
        { letra: 'B', texto: '3.14' },
        { letra: 'C', texto: '1.62' },
        { letra: 'D', texto: '4.20' },
      ],
      letraCorrecta: 'B',
      explicacion: 'Pi (π) es una constante matemática que representa la relación entre la circunferencia de un círculo y su diámetro. Su valor es aproximadamente 3.14159..., aunque es un número irracional con infinitos decimales no periódicos.',
    },
    {
      pregunta: '¿Cuánto es el 25% de 200?',
      opciones: [
        { letra: 'A', texto: '25' },
        { letra: 'B', texto: '75' },
        { letra: 'C', texto: '50' },
        { letra: 'D', texto: '100' },
      ],
      letraCorrecta: 'C',
      explicacion: 'El 25% equivale a un cuarto (1/4). Para calcular el 25% de 200, dividimos 200 entre 4: 200 ÷ 4 = 50. También se puede calcular como 200 × 0.25 = 50.',
    },
    {
      pregunta: 'Si un triángulo tiene lados de 3, 4 y 5 cm, ¿es un triángulo rectángulo?',
      opciones: [
        { letra: 'A', texto: 'No, es equilátero' },
        { letra: 'B', texto: 'Sí, cumple el teorema de Pitágoras' },
        { letra: 'C', texto: 'No, es isósceles' },
        { letra: 'D', texto: 'No se puede saber' },
      ],
      letraCorrecta: 'B',
      explicacion: 'Sí, es un triángulo rectángulo. Según el teorema de Pitágoras, en un triángulo rectángulo a² + b² = c². Comprobamos: 3² + 4² = 9 + 16 = 25 = 5². Este es el triángulo egipcio o "terna pitagórica" más conocida.',
    },
    {
      pregunta: '¿Cuántos grados tiene un ángulo recto?',
      opciones: [
        { letra: 'A', texto: '45°' },
        { letra: 'B', texto: '180°' },
        { letra: 'C', texto: '360°' },
        { letra: 'D', texto: '90°' },
      ],
      letraCorrecta: 'D',
      explicacion: 'Un ángulo recto mide exactamente 90 grados y forma una "L" perfecta. Se puede ver en las esquinas de una hoja de papel o en las intersecciones de calles perpendiculares. Un ángulo de 180° es un ángulo llano y el de 360° es una vuelta completa.',
    },
    {
      pregunta: '¿Cuál es el resultado de 12 × 12?',
      opciones: [
        { letra: 'A', texto: '124' },
        { letra: 'B', texto: '144' },
        { letra: 'C', texto: '132' },
        { letra: 'D', texto: '148' },
      ],
      letraCorrecta: 'B',
      explicacion: '12 × 12 = 144. Este número se conoce como "doce al cuadrado" o 12². Los cuadrados perfectos son los resultados de multiplicar un número por sí mismo. La secuencia sería: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144...',
    },
  ],
  Cine: [
    {
      pregunta: '¿Cuál es el Oscar más importante que se entrega en la ceremonia?',
      opciones: [
        { letra: 'A', texto: 'Mejor Director' },
        { letra: 'B', texto: 'Mejor Película' },
        { letra: 'C', texto: 'Mejor Actor' },
        { letra: 'D', texto: 'Mejor Guión' },
      ],
      letraCorrecta: 'B',
      explicacion: 'El Oscar a la Mejor Película (Best Picture) es el galardón más prestigioso de la ceremonia y siempre se entrega al final. Es el premio que reciben los productores de la película ganadora y representa el máximo reconocimiento de la industria cinematográfica.',
    },
    {
      pregunta: '¿Qué director es famoso por películas como "Tiburón" y "ET"?',
      opciones: [
        { letra: 'A', texto: 'Martin Scorsese' },
        { letra: 'B', texto: 'Steven Spielberg' },
        { letra: 'C', texto: 'James Cameron' },
        { letra: 'D', texto: 'Christopher Nolan' },
      ],
      letraCorrecta: 'B',
      explicacion: 'Steven Spielberg es uno de los directores más influyentes de Hollywood. "Tiburón" (1975) es considerada la primera película blockbuster de la historia, y "ET: el extraterrestre" (1982) fue la película más taquillera de su época.',
    },
    {
      pregunta: '¿En qué país se originó el cine?',
      opciones: [
        { letra: 'A', texto: 'Estados Unidos' },
        { letra: 'B', texto: 'Gran Bretaña' },
        { letra: 'C', texto: 'Francia' },
        { letra: 'D', texto: 'Alemania' },
      ],
      letraCorrecta: 'C',
      explicacion: 'El cine fue inventado en Francia por los hermanos Auguste y Louis Lumière. El 28 de diciembre de 1895 realizaron la primera proyección pública de películas en el Grand Café de París, lo que se considera el nacimiento oficial del cine.',
    },
    {
      pregunta: '¿Qué actor interpretó a Jack Sparrow en "Piratas del Caribe"?',
      opciones: [
        { letra: 'A', texto: 'Brad Pitt' },
        { letra: 'B', texto: 'Tom Hanks' },
        { letra: 'C', texto: 'Johnny Depp' },
        { letra: 'D', texto: 'Orlando Bloom' },
      ],
      letraCorrecta: 'C',
      explicacion: 'Johnny Depp interpretó al carismático Capitán Jack Sparrow en la saga "Piratas del Caribe" desde 2003. Su peculiar interpretación del personaje le valió una nominación al Oscar y convirtió al personaje en uno de los más icónicos de Disney.',
    },
    {
      pregunta: '¿Cuál fue la primera película animada de larga duración producida por Disney?',
      opciones: [
        { letra: 'A', texto: 'Cenicienta' },
        { letra: 'B', texto: 'Bambi' },
        { letra: 'C', texto: 'Fantasía' },
        { letra: 'D', texto: 'Blancanieves y los siete enanitos' },
      ],
      letraCorrecta: 'D',
      explicacion: 'Blancanieves y los siete enanitos (1937) fue la primera película animada de larga duración producida por Walt Disney. Fue un enorme éxito que cambió la industria del entretenimiento y estableció a Disney como referente de la animación.',
    },
    {
      pregunta: '¿Qué es el festival de cine de Cannes?',
      opciones: [
        { letra: 'A', texto: 'Una academia de cine' },
        { letra: 'B', texto: 'Un premio anual de la industria' },
        { letra: 'C', texto: 'El festival de cine más prestigioso del mundo' },
        { letra: 'D', texto: 'Un canal de televisión de cine' },
      ],
      letraCorrecta: 'C',
      explicacion: 'El Festival de Cannes, celebrado anualmente en la ciudad francesa de Cannes desde 1946, es uno de los festivales de cine más prestigiosos e influyentes del mundo. Su máximo galardón, la Palma de Oro, es uno de los premios cinematográficos más codiciados.',
    },
    {
      pregunta: '¿Qué película de animación presenta al personaje de Simba?',
      opciones: [
        { letra: 'A', texto: 'El libro de la selva' },
        { letra: 'B', texto: 'El rey león' },
        { letra: 'C', texto: 'Tarzan' },
        { letra: 'D', texto: 'Madagascar' },
      ],
      letraCorrecta: 'B',
      explicacion: 'Simba es el protagonista de "El rey león" (The Lion King, 1994), la aclamada película de animación de Disney. La historia, ambientada en la sabana africana, está inspirada en el Hamlet de Shakespeare y se convirtió en una de las películas de animación más exitosas de todos los tiempos.',
    },
    {
      pregunta: '¿Qué significa "CGI" en el cine?',
      opciones: [
        { letra: 'A', texto: 'Cine General Internacional' },
        { letra: 'B', texto: 'Imágenes generadas por computadora' },
        { letra: 'C', texto: 'Grabación cinematográfica independiente' },
        { letra: 'D', texto: 'Centro de guiones de imagen' },
      ],
      letraCorrecta: 'B',
      explicacion: 'CGI son las siglas de "Computer-Generated Imagery" (Imágenes generadas por computadora). Esta tecnología permite crear efectos visuales, personajes y entornos completamente digitales. Películas como Jurassic Park (1993) revolucionaron su uso, y hoy es fundamental en prácticamente toda producción cinematográfica.',
    },
  ],
}

// Índices para rotar preguntas del banco
const indicesUsados: Record<string, number[]> = {}

function obtenerPreguntaDelBanco(tema: Tema, sessionId: string): PreguntaEstatica {
  const banco = BANCO_PREGUNTAS[tema]
  const cacheKey = `banco_${sessionId}_${tema}`

  if (!indicesUsados[cacheKey]) {
    indicesUsados[cacheKey] = []
  }

  const usados = indicesUsados[cacheKey]

  // Reset si ya se usaron todas
  if (usados.length >= banco.length) {
    indicesUsados[cacheKey] = []
  }

  const disponibles = banco
    .map((_, i) => i)
    .filter((i) => !indicesUsados[cacheKey].includes(i))

  const indice = disponibles[Math.floor(Math.random() * disponibles.length)]
  indicesUsados[cacheKey].push(indice)

  return banco[indice]
}

// ---------------------------------------------------------------
// GET — Obtener una pregunta para el tema dado
// ---------------------------------------------------------------
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const tema = searchParams.get('tema') as Tema
  const sessionId = searchParams.get('sessionId') || session.user.email

  const temasValidos: Tema[] = ['Historia', 'Geografía', 'Matemáticas', 'Cine']
  if (!temasValidos.includes(tema)) {
    return NextResponse.json({ error: 'Tema inválido' }, { status: 400 })
  }

  // Intentar generar pregunta con Wikipedia, caer al banco estático si falla
  let preguntaData: PreguntaEstatica

  try {
    // Intentar obtener extracto de Wikipedia
    const { titulo, extracto } = await obtenerExtractoWikipedia(tema, sessionId)
    const fragmento = truncarExtracto(extracto)

    // Generar pregunta basada en el extracto (lógica de extracción de datos)
    const preguntaGenerada = generarPreguntaDesdeExtracto(tema, titulo, fragmento)

    if (preguntaGenerada) {
      preguntaData = preguntaGenerada
    } else {
      // Si no se pudo generar una pregunta válida, usar banco estático
      preguntaData = obtenerPreguntaDelBanco(tema, sessionId)
    }
  } catch {
    // Si Wikipedia falla, usar banco estático
    preguntaData = obtenerPreguntaDelBanco(tema, sessionId)
  }

  // Mezclar las opciones para que la correcta no sea siempre la misma posición
  const opcionesMezcladas = mezclarOpciones(preguntaData.opciones, preguntaData.letraCorrecta)

  // Generar ID único para esta pregunta
  const preguntaId = randomUUID()

  // Guardar la respuesta correcta de forma segura en el servidor
  preguntasSecretas.set(preguntaId, {
    letraCorrecta: opcionesMezcladas.nuevaLetraCorrecta,
    explicacion: preguntaData.explicacion,
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutos
  })

  // Devolver pregunta SIN la respuesta correcta
  const preguntaPublica: PreguntaPublica = {
    id: preguntaId,
    tema,
    pregunta: preguntaData.pregunta,
    opciones: opcionesMezcladas.opciones,
  }

  return NextResponse.json(preguntaPublica)
}

// ---------------------------------------------------------------
// POST — Validar la respuesta del jugador
// ---------------------------------------------------------------
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { preguntaId, respuesta } = body

  if (!preguntaId || !respuesta) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
  }

  // Buscar la pregunta secreta
  const secreto = preguntasSecretas.get(preguntaId)

  if (!secreto) {
    return NextResponse.json(
      { error: 'Pregunta no encontrada o expirada. Solicita una nueva.' },
      { status: 404 }
    )
  }

  if (secreto.expiresAt < Date.now()) {
    preguntasSecretas.delete(preguntaId)
    return NextResponse.json({ error: 'La pregunta ha expirado' }, { status: 410 })
  }

  const correcto = respuesta === secreto.letraCorrecta

  // Limpiar la pregunta después de validar (no se puede reutilizar)
  preguntasSecretas.delete(preguntaId)

  return NextResponse.json({
    correcto,
    letraCorrecta: secreto.letraCorrecta,
    explicacion: secreto.explicacion,
    puntosCambio: correcto ? 2 : -1,
  })
}

// ---------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------

/**
 * Intenta generar una pregunta a partir de un extracto de Wikipedia.
 * Usa patrones para extraer datos interesantes del texto.
 */
function generarPreguntaDesdeExtracto(
  tema: Tema,
  titulo: string,
  extracto: string
): PreguntaEstatica | null {
  // Buscar años en el extracto
  const añoMatch = extracto.match(/\b(en\s+el\s+año\s+|en\s+)(\d{4})\b/i)

  if (añoMatch) {
    const año = parseInt(añoMatch[2])
    if (año > 1000 && año < 2100) {
      const pregunta = `¿En qué año ocurrió el evento principal relacionado con "${titulo}"?`
      const correcta = año.toString()

      // Generar distractores razonables
      const variaciones = [-3, -7, 5, 10].map((d) => (año + d).toString())
      const [d1, d2, d3] = variaciones

      const opciones: { letra: 'A' | 'B' | 'C' | 'D'; texto: string }[] = [
        { letra: 'A', texto: d1 },
        { letra: 'B', texto: correcta },
        { letra: 'C', texto: d2 },
        { letra: 'D', texto: d3 },
      ]

      return {
        pregunta,
        opciones,
        letraCorrecta: 'B',
        explicacion: `Según la información de Wikipedia sobre "${titulo}": ${extracto.substring(0, 200)}...`,
      }
    }
  }

  return null
}

/**
 * Mezcla las opciones aleatoriamente y devuelve la nueva letra correcta.
 */
function mezclarOpciones(
  opciones: OpcionRespuesta[],
  letraCorrectaOriginal: 'A' | 'B' | 'C' | 'D'
): { opciones: OpcionRespuesta[]; nuevaLetraCorrecta: 'A' | 'B' | 'C' | 'D' } {
  const letras: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']

  // Encontrar el texto de la respuesta correcta
  const textoCorrecta = opciones.find((o) => o.letra === letraCorrectaOriginal)?.texto || ''

  // Mezclar los textos
  const textos = opciones.map((o) => o.texto)
  for (let i = textos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[textos[i], textos[j]] = [textos[j], textos[i]]
  }

  // Reasignar letras
  const nuevasOpciones: OpcionRespuesta[] = textos.map((texto, i) => ({
    letra: letras[i],
    texto,
  }))

  // Encontrar la nueva letra de la respuesta correcta
  const nuevaLetraCorrecta = nuevasOpciones.find((o) => o.texto === textoCorrecta)?.letra || 'A'

  return { opciones: nuevasOpciones, nuevaLetraCorrecta }
}
