'use strict';
/* =====================================================================
   FlowLab Studio · freestyle-data.js
   Biblioteca de contenido de la Escuela de Freestyle: palabras por nivel y
   categoría, temáticas, pies forzados, contrastes, terminaciones, objetos y
   personajes. Solo datos (sin lógica), para poder ampliarla sin miedo.
   ===================================================================== */
(function () {
  const w = s => s.trim().split(/\s+/);

  /* ---- Palabras por dificultad y categoría ---- */
  const WORDS = {
    facil: {
      objetos: w('mesa silla puerta ventana llave reloj espejo lámpara cama almohada vaso plato cuchara olla mochila zapato gorra lentes celular audífonos micrófono parlante cuaderno lápiz borrador tijera martillo escalera bicicleta moto carro bus pelota guitarra tambor vela fósforo cadena anillo collar billetera sobre caja bolsa paraguas toalla jabón peine cepillo radio tele control foco enchufe cable'),
      naturaleza: w('sol luna estrella nube lluvia trueno rayo viento río mar ola playa arena montaña cerro piedra roca árbol hoja flor rosa raíz semilla tierra fuego humo hielo nieve niebla volcán selva desierto lago cascada cielo arcoíris amanecer atardecer noche día tormenta isla cueva bosque'),
      animales: w('perro gato león tigre lobo zorro oso águila cóndor halcón paloma cuervo búho tiburón ballena delfín pulpo cangrejo serpiente lagarto mono gorila caballo burro vaca toro chancho gallina pollo pato ratón rata conejo llama alpaca vicuña cuy hormiga abeja araña mosca mariposa grillo'),
      comida: w('ceviche pollo papa arroz frejol lomo anticucho choclo cancha camote yuca pan queso leche huevo café chocolate helado torta galleta caramelo mango plátano fresa uva limón naranja manzana palta tomate cebolla ají sal azúcar sopa caldo hamburguesa pizza salchipapa chifa causa tamal picarones mazamorra chicha'),
      cuerpo: w('mano pie ojo boca nariz oreja cabeza pelo cara diente lengua cuello hombro brazo codo dedo uña pecho corazón espalda pierna rodilla piel sangre hueso voz garganta frente ceja labio'),
      ciudad: w('calle esquina barrio plaza parque mercado tienda bodega escuela colegio hospital iglesia estadio puente avenida semáforo vereda pista paradero combi micro taxi edificio azotea techo pared grafiti mural cancha discoteca cine farmacia banco cárcel comisaría'),
      acciones: w('correr saltar volar nadar bailar cantar gritar llorar reír soñar pensar mirar escuchar hablar caminar subir bajar caer luchar ganar perder buscar encontrar romper crear borrar escribir leer comer dormir despertar volver huir esperar')
    },
    medio: {
      emociones: w('miedo rabia alegría tristeza envidia orgullo vergüenza nostalgia ansiedad esperanza celos culpa calma euforia odio amor cariño soledad confianza duda coraje paciencia locura ternura rencor deseo ilusión desprecio angustia'),
      profesiones: w('doctor enfermera profesor policía bombero cocinero mozo chofer piloto soldado abogado juez periodista fotógrafo pintor albañil carpintero mecánico panadero granjero pescador minero ingeniero programador científico astronauta payaso mago boxeador futbolista árbitro barbero tatuador vendedor'),
      deportes: w('gol penal arquero delantero defensa camiseta tribuna hinchada clásico final campeón medalla trofeo ring nocaut round cinturón tabla patineta surf maratón meta récord estadio silbato tarjeta offside chalaca'),
      musica: w('beat base flow rima barra verso coro estribillo puente intro outro tempo compás bombo caja hihat bajo melodía sample scratch vinilo tornamesa estudio cabina tarima escenario público aplausos batalla cypher freestyle métrica cadencia punchline'),
      tecnologia: w('internet wifi pantalla teclado mouse código algoritmo robot dron satélite cohete batería cargador aplicación videojuego consola mando servidor nube contraseña virus hacker red señal antena láser holograma chip procesador selfie filtro likes seguidores'),
      peru: w('Lima Cusco Arequipa Trujillo Iquitos Puno Callao Chorrillos Barranco Miraflores Rímac Comas combi chamba causa pata jato bacán chévere jerga huayco garúa neblina inti Machupicchu Titicaca nazca marinera huayno cumbia chicha pisco inca sol peruano'),
      viajes: w('viaje maleta pasaporte aeropuerto avión tren barco frontera mapa brújula ruta camino destino hotel hostal carpa mochila turista guía postal recuerdo regreso partida llegada kilómetro horizonte')
    },
    dificil: {
      abstractos: w('libertad justicia verdad mentira destino tiempo eternidad silencio vacío caos orden poder gloria fama legado memoria olvido conciencia alma espíritu razón fe miedo traición lealtad honor dignidad sacrificio redención karma paradoja utopía'),
      cultas: w('efímero melancolía resiliencia catarsis metamorfosis epifanía idiosincrasia vorágine quimera parsimonia vehemencia sempiterno inefable ubicuo laberinto apocalipsis renacimiento hipocresía clandestino perpetuo vértigo nostálgico intrépido sinfonía', ),
      ciencia: w('átomo galaxia gravedad universo planeta órbita energía materia molécula ADN neurona evolución fósil eclipse cometa meteorito electricidad magnetismo química física fórmula experimento laboratorio microscopio telescopio'),
      sociedad: w('política gobierno corrupción elecciones democracia dictadura revolución protesta huelga sistema economía inflación deuda pobreza riqueza herencia frontera migración identidad cultura tradición globalización'),
      filosofia: w('existencia realidad ilusión espejismo dualidad equilibrio contradicción perspectiva sabiduría ignorancia ego humildad soberbia vanidad propósito infinito absurdo esencia trascender')
    }
  };

  /* ---- Vocales para el juego Univocal (palabras que terminan en esa vocal tónica) ---- */
  const VOWELS = {
    a: w('alma calma fama llama cama drama trama rama nada casa plaza mapa gana raza playa vaca bala capa lata garra'),
    e: w('fe ser ver mes pez vez tres verde leche mente gente frente fuerte suerte muerte nieve breve sede red pared'),
    i: w('sí aquí vivir subir fin mil gris chispa risa misa piscina filo circo lirio tinta grito mito ritmo camino destino'),
    o: w('sol hoy soy voz dolor calor flor todo loco poco oro polvo rojo ojo corazón razón canción amor control rincón'),
    u: w('luz azul tú cruz luna cuna puro duro humo futuro nube música sur rumbo bambú Perú tabú menú iglú pulso')
  };

  /* ---- Temáticas (estilo batalla) ---- */
  const TOPICS = ([
    'El barrio donde creciste', 'Tu primer amor', 'La plata y la fama', 'Las', 'El fútbol peruano',
    'La combi de las 7 a.m.', 'Un día lluvioso en Lima', 'Tus sueños de niño', 'La amistad verdadera', 'La traición',
    'El tiempo que no vuelve', 'La familia', 'Tu mamá', 'El colegio', 'El trabajo duro', 'La noche en la ciudad',
    'La tecnología', 'Los videojuegos', 'La comida peruana', 'El mar', 'La montaña', 'El miedo', 'La libertad',
    'La corrupción', 'El hip hop', 'Tu primera batalla', 'La envidia', 'El éxito', 'El fracaso que te hizo fuerte',
    'La música que te salvó', 'El futuro', 'Los extraterrestres', 'El fin del mundo', 'Un superhéroe', 'Un villano',
    'La cárcel', 'El hospital', 'El aeropuerto', 'Una fiesta', 'Una despedida', 'El primer sueldo', 'Las apuestas',
    'La política', 'El calentamiento global', 'Los animales', 'La soledad', 'Las madrugadas', 'El café', 'Los perros',
    'El gimnasio', 'La universidad', 'El tráfico', 'El celular', 'La inteligencia artificial', 'Viajar por el mundo',
    'El dinero no compra la felicidad', 'Los haters', 'La fe', 'La humildad', 'El ego', 'La calle te enseña',
    'El primer beat que escuchaste', 'Un domingo cualquiera', 'Los recuerdos', 'La lealtad', 'El respeto',
    'Pobre vs rico', 'Ciudad vs campo', 'Pasado vs futuro', 'El amor vs el dinero', 'La verdad duele'
  ]);

  /* ---- Pies forzados: líneas con las que debes CERRAR tus 4 barras ---- */
  const PIES = [
    'y por eso nunca me rindo', 'la calle me enseñó a ser fuerte', 'el tiempo pone a cada uno en su lugar',
    'mi rima vale más que tu dinero', 'vengo del barrio y no lo olvido', 'en la tarima soy el rey',
    'la vida es una batalla diaria', 'no hay mal que dure cien años', 'mi flow no se compra ni se vende',
    'y el público lo sabe', 'yo nací para esto', 'con mi voz cambio el mundo', 'lo que no te mata te hace fuerte',
    'soñar no cuesta nada', 'el que la sigue la consigue', 'mi mamá siempre tuvo razón', 'sin miedo a perder',
    'el silencio también habla', 'la humildad es mi bandera', 'del suelo hasta las nubes', 'cada barra es un ladrillo',
    'mi lápiz es mi espada', 'esto recién empieza', 'el respeto se gana', 'la verdad siempre sale', 'nadie me regaló nada',
    'contra viento y marea', 'mi rima es mi refugio', 'Lima no duerme', 'el beat me lleva', 'te lo digo de frente',
    'por mi gente y por mi barrio', 'la envidia no me alcanza', 'el fuego no se apaga', 'yo escribo mi destino',
    'de la nada a la cima', 'el micro no miente', 'cuando caigo me levanto', 'aquí no hay segundas partes',
    'el corazón no se equivoca', 'la noche es mi aliada', 'el reloj sigue corriendo', 'pura esencia, nada de pose'
  ];

  /* ---- Contrastes: dos palabras que debes conectar en tus barras ---- */
  const CONTRASTS = [
    ['fuego', 'hielo'], ['cielo', 'infierno'], ['rico', 'pobre'], ['amor', 'odio'], ['guerra', 'paz'], ['día', 'noche'],
    ['ángel', 'demonio'], ['verdad', 'mentira'], ['ganar', 'perder'], ['pasado', 'futuro'], ['calle', 'palacio'],
    ['risa', 'llanto'], ['luz', 'sombra'], ['león', 'oveja'], ['mar', 'desierto'], ['rey', 'mendigo'], ['silencio', 'grito'],
    ['libertad', 'cárcel'], ['nacer', 'morir'], ['héroe', 'villano'], ['papel', 'tijera'], ['sueño', 'pesadilla'],
    ['oro', 'barro'], ['inicio', 'final'], ['lento', 'rápido'], ['amigo', 'enemigo'], ['dulce', 'amargo'], ['ciudad', 'campo'],
    ['tierra', 'luna'], ['humilde', 'creído'], ['tortuga', 'liebre'], ['vino', 'agua'], ['espada', 'escudo'], ['raíz', 'rama'],
    ['máscara', 'rostro'], ['hambre', 'banquete'], ['tormenta', 'calma'], ['robot', 'humano'], ['niño', 'anciano'], ['norte', 'sur']
  ];

  /* ---- Terminaciones para cerrar la barra (con ejemplos de ayuda) ---- */
  const ENDINGS = [
    ['-ado', 'pasado, lado, soldado'], ['-ida', 'vida, herida, salida'], ['-ón', 'corazón, razón, canción'],
    ['-ar', 'amar, soñar, lugar'], ['-er', 'poder, crecer, mujer'], ['-ir', 'vivir, sentir, subir'],
    ['-ad', 'verdad, ciudad, libertad'], ['-or', 'amor, dolor, mejor'], ['-ente', 'gente, mente, frente'],
    ['-ento', 'viento, momento, talento'], ['-ura', 'locura, altura, cultura'], ['-ero', 'dinero, guerrero, sendero'],
    ['-ino', 'camino, destino, latino'], ['-eza', 'cabeza, tristeza, grandeza'], ['-ía', 'día, poesía, energía'],
    ['-ante', 'diamante, gigante, adelante'], ['-oche', 'noche, coche, derroche'], ['-al', 'final, brutal, señal'],
    ['-uego', 'fuego, juego, luego'], ['-elo', 'cielo, suelo, vuelo'], ['-ueño', 'sueño, dueño, pequeño'],
    ['-aje', 'viaje, coraje, mensaje'], ['-ible', 'imposible, increíble, invisible'], ['-ista', 'vista, pista, artista'],
    ['-oso', 'famoso, peligroso, poderoso'], ['-ito', 'grito, mito, infinito'], ['-una', 'luna, fortuna, cuna'],
    ['-uro', 'futuro, muro, oscuro'], ['-alma', 'alma, calma, palma'], ['-ena', 'pena, cadena, escena']
  ];

  /* ---- Objetos con imagen (para describir y sacar metáforas) ---- */
  const OBJECTS = [
    ['🔥', 'fuego'], ['💎', 'diamante'], ['🎤', 'micrófono'], ['⌚', 'reloj'], ['🔑', 'llave'], ['🪞', 'espejo'], ['🕯️', 'vela'],
    ['⚽', 'pelota'], ['🎧', 'audífonos'], ['📱', 'celular'], ['💰', 'dinero'], ['👑', 'corona'], ['🗡️', 'espada'], ['🛡️', 'escudo'],
    ['🌙', 'luna'], ['☀️', 'sol'], ['🌧️', 'lluvia'], ['⚡', 'rayo'], ['🌊', 'ola'], ['🌋', 'volcán'], ['🏔️', 'montaña'], ['🌹', 'rosa'],
    ['🦁', 'león'], ['🐺', 'lobo'], ['🦅', 'águila'], ['🐍', 'serpiente'], ['🦈', 'tiburón'], ['🐢', 'tortuga'], ['🦂', 'escorpión'],
    ['🚀', 'cohete'], ['🚌', 'combi'], ['✈️', 'avión'], ['🚲', 'bicicleta'], ['🏆', 'trofeo'], ['🎲', 'dado'], ['🃏', 'comodín'],
    ['🧠', 'cerebro'], ['❤️', 'corazón'], ['👁️', 'ojo'], ['✋', 'mano'], ['💀', 'calavera'], ['👻', 'fantasma'], ['🤖', 'robot'],
    ['📚', 'libros'], ['✏️', 'lápiz'], ['🎨', 'pintura'], ['🎸', 'guitarra'], ['🥁', 'tambor'], ['📻', 'radio'], ['💡', 'foco'],
    ['🍋', 'limón'], ['🌶️', 'ají'], ['☕', 'café'], ['🍕', 'pizza'], ['🧊', 'hielo'], ['⛓️', 'cadena'], ['🧭', 'brújula'], ['🗺️', 'mapa'],
    ['⏳', 'reloj de arena'], ['🎯', 'diana'], ['🧩', 'rompecabezas'], ['🪙', 'moneda'], ['🎭', 'máscaras'], ['🌵', 'cactus']
  ];

  /* ---- Personajes (para el juego de rol: rapea siendo…) ---- */
  const CHARACTERS = [
    'un taxista de Lima', 'una abuela que rapea', 'un futbolista frustrado', 'un profesor estricto', 'un policía corrupto',
    'un cocinero de ceviche', 'un astronauta perdido', 'un pirata', 'un robot con sentimientos', 'un rey sin reino',
    'un vendedor de combi', 'un gato callejero', 'un fantasma enamorado', 'un mago sin trucos', 'un boxeador retirado',
    'un hacker', 'un influencer', 'un médico de guardia', 'un alien turista', 'un perro guardián', 'un detective',
    'un superhéroe cansado', 'un villano arrepentido', 'un barbero chismoso', 'un DJ en su última fiesta'
  ];

  /* ---- Emociones y temas propios (Mejoras 7 · G). Solo palabras e ideas neutras: estructura para que el usuario diga lo suyo ---- */
  const EMOCIONES = {
    rabia: { n: 'Rabia', icon: '😤', palabras: w('fuego trueno puño grito muro cadena tormenta volcán ruido límite cansancio injusticia'),
      ideas: ['¿Qué situación te hizo explotar y qué harías distinto hoy?', 'Háblale a la rabia: ¿por qué llegó?', 'Convierte ese fuego en energía: ¿qué construirías con él?', '¿Qué te gustaría que los demás entendieran de esto?'] },
    tristeza: { n: 'Tristeza', icon: '😢', palabras: w('lluvia silencio sombra vacío lágrima gris noche distancia ausencia nube espejo peso'),
      ideas: ['¿Qué te pesa hoy y dónde lo sientes en el cuerpo?', 'Describe un día gris como si fuera una película.', '¿Qué extrañas y qué le dirías?', '¿Qué te ayudaría a sentirte acompañado?'] },
    alegria: { n: 'Alegría', icon: '😄', palabras: w('sol risa baile fiesta brillo abrazo color vuelo música domingo sorpresa playa'),
      ideas: ['Cuenta el mejor momento de tu semana.', '¿Quién te hace reír sin esfuerzo?', 'Imagina que tu alegría tiene color y sonido: descríbelos.', '¿Qué celebrarías hoy si pudieras?'] },
    nostalgia: { n: 'Nostalgia', icon: '📻', palabras: w('recuerdo foto infancia patio cassette esquina verano ayer álbum tiempo huella eco'),
      ideas: ['Un lugar de tu infancia: ¿cómo olía y cómo sonaba?', 'Una canción que te lleva al pasado.', '¿Qué le dirías a tu yo de niño?', '¿Qué de antes te gustaría traer al presente?'] },
    amor: { n: 'Amor', icon: '💛', palabras: w('corazón abrazo mirada cielo promesa latido ternura hogar compañía flor beso luz'),
      ideas: ['Describe a alguien que quieres sin decir su nombre.', '¿Qué es para ti cuidar a alguien?', 'Una promesa que sí quieres cumplir.', '¿Cómo suena el amor cuando es tranquilo?'] },
    miedo: { n: 'Miedo', icon: '😨', palabras: w('sombra oscuridad puerta eco abismo latido escalera silencio duda salto incierto reloj'),
      ideas: ['¿A qué le tienes miedo y cómo se ve si lo dibujas?', '¿Qué harías si el miedo no existiera por un día?', 'Un miedo que ya superaste: ¿cómo lo lograste?', '¿Quién te da calma cuando algo te asusta?'] },
    esperanza: { n: 'Esperanza', icon: '🌱', palabras: w('semilla amanecer puente camino luz brote mañana horizonte ventana sueño raíz cima'),
      ideas: ['¿Qué quieres que pase mañana?', 'Un sueño que todavía cuidas.', '¿Qué semilla estás plantando hoy?', 'Escríbele una barra de ánimo a alguien que lo necesita.'] }
  };
  const TEMAS_PROPIOS = {
    mibarrio: { n: 'Mi barrio', icon: '🏘️', palabras: w('esquina bodega pasaje combi mercado vecino azotea cancha paradero parque vereda pista'),
      ideas: ['Presenta tu barrio como si quien escucha nunca hubiera venido.', 'Una persona del barrio que te marcó.', 'Algo que cambiarías y algo que jamás cambiarías.', '¿Cómo suena tu barrio a las seis de la tarde?'] },
    mihistoria: { n: 'Mi historia', icon: '📖', palabras: w('origen camino familia mudanza error lección maestro caída giro destino huella comienzo'),
      ideas: ['¿Dónde empezó todo?', 'Un error del que aprendiste mucho.', 'La persona que más influyó en tu camino.', '¿Qué parte de tu historia todavía estás escribiendo?'] },
    superacion: { n: 'Superación', icon: '🏔️', palabras: w('meta cima esfuerzo caída constancia paso disciplina obstáculo sueño cambio fuerza victoria'),
      ideas: ['Algo que antes no podías y hoy sí.', '¿Qué te hace levantarte cuando cuesta?', 'Describe tu cima: ¿cómo se ve desde arriba?', 'Un consejo para quien está empezando.'] },
    amordesamor: { n: 'Amor y desamor', icon: '💔', palabras: w('corazón adiós promesa beso distancia recuerdo herida regreso mirada abrazo olvido cicatriz'),
      ideas: ['Una despedida que dolió y qué aprendiste.', '¿Qué es lo más bonito de querer a alguien?', 'Háblale a alguien que ya no está, sin reproches.', '¿Cómo se cura lo que duele?'] }
  };

  window.FREESTYLE_DATA = { WORDS, VOWELS, TOPICS, PIES, CONTRASTS, ENDINGS, OBJECTS, CHARACTERS, EMOCIONES, TEMAS_PROPIOS };
})();
